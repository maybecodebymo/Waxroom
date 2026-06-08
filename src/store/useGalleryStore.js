import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, isFirebaseConfigured, auth } from '../utils/firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, doc, query, orderBy, limit, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const buildGenres = (albums) => ['All', ...new Set(albums.map((album) => album.genre))];

const defaultSceneControls = {
  globeRadius: 7.1,
  globeHeight: 4.8,
  dragSpeed: 0.0044,
  dragDamp: 0.1,
  tiltFactor: 0.22,
  focusScale: 1.52,
  dimScale: 0.58,
  dimOpacity: 0.2,
  zoomIn: 4.2,
  zoomOut: 0,
  camDamp: 0.08,
};

const sceneControlsVersion = 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeSceneControls = (controls, legacy = false) => {
  const next = {
    ...defaultSceneControls,
    ...(controls ?? {}),
  };

  if (legacy) {
    next.zoomOut = (typeof next.zoomOut === 'number' ? next.zoomOut : 8.5) - 8.5;
  }

  next.zoomOut = clamp(next.zoomOut, -8, 8);
  next.zoomIn = clamp(next.zoomIn, 2.4, 7);

  return next;
};


export const useGalleryStore = create(
  persist(
    (set, get) => ({
      myAlbums: [],
      albums: [],
      crateInbox: [],
      hasUnseenCrateItems: false,
      listeningHistory: [],
      genres: ['All'],
      user: null,
      lastFmUsername: '',
      livePlayback: null,
      activeRoomPlayback: null,
      selectedAlbumId: null,
      activeGenre: 'All',
      isAddModalOpen: false,
      editingAlbumId: null,
      canEditAlbums: true,
      sceneControls: defaultSceneControls,
      sceneControlsVersion,
      vaultName: '',
      rooms: [{ id: 'default', name: 'My Room', albums: [], description: '', isPublished: false }],
      activeRoomId: 'default',
      spotifyAccessToken: '',
      spotifyTokenExpiry: 0,
      setSpotifyToken: (token, expiresMs) => set({
        spotifyAccessToken: token,
        spotifyTokenExpiry: Date.now() + expiresMs
      }),
      createNewRoom: async (name) => {
        const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const newRoom = { id, name, albums: [], description: '', isPublished: false };
        set((state) => {
          const updatedRooms = state.rooms.map(r => r.id === state.activeRoomId ? {
            ...r,
            name: state.vaultName,
            albums: state.myAlbums,
            description: state.publishedDescription,
            isPublished: state.isPublished
          } : r);
          
          return {
            rooms: [...updatedRooms, newRoom],
            activeRoomId: id,
            myAlbums: [],
            albums: [],
            genres: ['All'],
            vaultName: name,
            publishedDescription: '',
            isPublished: false,
            selectedAlbumId: null,
            activeGenre: 'All'
          };
        });
        
        await get().backupRoomToCloud();
      },
      switchRoom: async (roomId) => {
        const state = get();
        if (roomId === state.activeRoomId) return;
        
        const updatedRooms = state.rooms.map(r => r.id === state.activeRoomId ? {
          ...r,
          name: state.vaultName,
          albums: state.myAlbums,
          description: state.publishedDescription,
          isPublished: state.isPublished
        } : r);
        
        const targetRoom = updatedRooms.find(r => r.id === roomId);
        if (!targetRoom) return;
        
        set({
          rooms: updatedRooms,
          activeRoomId: roomId,
          myAlbums: targetRoom.albums || [],
          albums: targetRoom.albums || [],
          genres: buildGenres(targetRoom.albums || []),
          vaultName: targetRoom.name || '',
          publishedDescription: targetRoom.description || '',
          isPublished: targetRoom.isPublished || false,
          selectedAlbumId: null,
          activeGenre: 'All'
        });
        
        await get().backupRoomToCloud();
        if (targetRoom.isPublished) {
          await get().syncLiveRoomToFirestore();
        }
      },
      deleteRoom: async (roomId) => {
        const state = get();
        if (state.rooms.length <= 1) return;
        
        let nextActiveId = state.activeRoomId;
        let nextAlbums = state.myAlbums;
        let nextName = state.vaultName;
        let nextDesc = state.publishedDescription;
        let nextIsPub = state.isPublished;
        
        const roomToDelete = state.rooms.find(r => r.id === roomId);
        
        if (state.activeRoomId === roomId) {
          const remaining = state.rooms.filter(r => r.id !== roomId);
          const fallback = remaining[0];
          nextActiveId = fallback.id;
          nextAlbums = fallback.albums || [];
          nextName = fallback.name || '';
          nextDesc = fallback.description || '';
          nextIsPub = fallback.isPublished || false;
        }
        
        set((state) => ({
          rooms: state.rooms.filter(r => r.id !== roomId),
          activeRoomId: nextActiveId,
          myAlbums: nextAlbums,
          albums: nextAlbums,
          genres: buildGenres(nextAlbums),
          vaultName: nextName,
          publishedDescription: nextDesc,
          isPublished: nextIsPub,
          selectedAlbumId: null,
          activeGenre: 'All'
        }));
        
        if (roomToDelete && roomToDelete.isPublished && isFirebaseConfigured && db && state.user) {
          try {
            await deleteDoc(doc(db, 'community_rooms', `${state.user.uid}_${roomId}`));
          } catch (err) {
            console.error('Failed to unpublish deleted room:', err);
          }
        }
        
        await get().backupRoomToCloud();
      },
      populateRoomFromSpotify: async (type) => {
        const token = get().spotifyAccessToken;
        if (!token) return { success: false, error: 'Spotify not connected' };

        try {
          let url = '';
          if (type === 'tracks') {
            url = 'https://api.spotify.com/v1/me/top/tracks?limit=20';
          } else if (type === 'albums') {
            url = 'https://api.spotify.com/v1/me/albums?limit=20';
          } else {
            return { success: false, error: 'Invalid import type' };
          }

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP error ${response.status}`);
          }

          const data = await response.json();
          let importedAlbums = [];

          if (type === 'tracks' && data.items) {
            importedAlbums = data.items.map((track) => {
              const artistName = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
              const albumTitle = track.album?.name || 'Unknown Album';
              const albumArtUrl = track.album?.images?.[0]?.url || '/placeholder-album.png';
              
              return {
                id: `sp-track-${track.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                artist: artistName,
                album_title: albumTitle,
                genre: 'Pop',
                rating: 8,
                description: `Imported top track "${track.name}" from Spotify!`,
                texture_url: albumArtUrl,
                tracklist: [{ title: track.name, category: 'hit' }]
              };
            });
          } else if (type === 'albums' && data.items) {
            importedAlbums = data.items.map((item) => {
              const album = item.album;
              if (!album) return null;
              const artistName = album.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
              const albumTitle = album.name || 'Unknown Album';
              const albumArtUrl = album.images?.[0]?.url || '/placeholder-album.png';
              const tracksList = album.tracks?.items?.map(t => ({
                title: t.name,
                category: 'meh'
              })) || [];

              return {
                id: `sp-album-${album.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                artist: artistName,
                album_title: albumTitle,
                genre: 'Alt',
                rating: 8,
                description: `Imported saved album from Spotify!`,
                texture_url: albumArtUrl,
                tracklist: tracksList.length > 0 ? tracksList : [{ title: 'Track 1', category: 'meh' }]
              };
            }).filter(Boolean);
          }

          if (importedAlbums.length === 0) {
            return { success: true, count: 0 };
          }

          const currentAlbums = [...get().myAlbums];
          const added = [];
          
          for (const imp of importedAlbums) {
            const exists = currentAlbums.some(
              (a) => a.album_title.toLowerCase().trim() === imp.album_title.toLowerCase().trim()
            );
            if (!exists) {
              currentAlbums.push(imp);
              added.push(imp);
            }
          }

          if (added.length > 0) {
            set({
              myAlbums: currentAlbums,
              albums: currentAlbums,
              genres: buildGenres(currentAlbums),
              activeGenre: 'All',
              selectedAlbumId: added[added.length - 1].id
            });

            await get().syncLiveRoomToFirestore();
            await get().backupRoomToCloud();
          }

          return { success: true, count: added.length };
        } catch (err) {
          console.error('Spotify import failed:', err);
          return { success: false, error: err.message };
        }
      },
      setVaultName: async (name) => {
        set({ vaultName: name });
        if (get().isPublished) {
          await get().syncLiveRoomToFirestore();
        }
        await get().backupRoomToCloud();
      },
      hasCompletedTour: false,
      setCompletedTour: (completed) => set({ hasCompletedTour: completed }),
      tourStepIndex: 0,
      setTourStepIndex: (index) => set({ tourStepIndex: index }),
      isRecommendationsOpen: false,
      setRecommendationsOpen: (isOpen) => set({ isRecommendationsOpen: isOpen }),
      isViewingShared: false,
      sharedOwnerName: null,
      timelineRooms: [],
      timelineError: null,
      isFeedOpen: false,
      setFeedOpen: (isOpen) => set({ isFeedOpen: isOpen }),
      isHistoryOpen: false,
      setHistoryOpen: (isOpen) =>
        set((state) => ({
          isHistoryOpen: isOpen,
          hasUnseenCrateItems: isOpen ? false : state.hasUnseenCrateItems,
        })),
      isPublished: false,
      publishedDescription: '',
      lastPublishedVaultName: '',
      toggleEditMode: () => set((state) => ({ canEditAlbums: !state.canEditAlbums })),
      activeTrack: null,
      isPlaying: false,
      activeBgColor: '#f5f5f3',
      setActiveTrack: (track) => set({ activeTrack: track, isPlaying: !!track }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setActiveBgColor: (color) => set({ activeBgColor: color }),
      selectAlbum: (albumId) => set((state) => {
        // Reset active track and background color when selecting a new album / deselecting
        const nextState = { selectedAlbumId: albumId };
        if (!albumId) {
          nextState.activeTrack = null;
          nextState.isPlaying = false;
          nextState.activeBgColor = '#f5f5f3';
        }
        return nextState;
      }),
      setGenre: (genre) =>
        set((state) => ({
          activeGenre: genre,
          selectedAlbumId:
            genre === 'All' || state.albums.find((album) => album.id === state.selectedAlbumId && album.genre === genre)
              ? state.selectedAlbumId
              : null,
        })),
      setAddModalOpen: (isOpen) => {
        if (!get().canEditAlbums) {
          return;
        }
        set({ isAddModalOpen: isOpen, editingAlbumId: isOpen ? null : null });
      },
      openEditModal: (albumId) => {
        if (!get().canEditAlbums) {
          return;
        }

        set({ isAddModalOpen: true, editingAlbumId: albumId });
      },
      closeAlbumModal: () => {
        set({ isAddModalOpen: false, editingAlbumId: null });
      },
      addAlbum: (albumObject) => {
        if (!get().canEditAlbums || get().isViewingShared) return;

        set((state) => {
          const myAlbums = [...state.myAlbums, albumObject];
          return {
            myAlbums,
            albums: myAlbums,
            genres: buildGenres(myAlbums),
            selectedAlbumId: albumObject.id,
            activeGenre: 'All',
          };
        });

        get().syncLiveRoomToFirestore();
      },
      updateAlbum: (albumId, albumPatch) => {
        if (!get().canEditAlbums || get().isViewingShared) return;

        set((state) => {
          const myAlbums = state.myAlbums.map((album) => (album.id === albumId ? { ...album, ...albumPatch } : album));
          return {
            myAlbums,
            albums: myAlbums,
            genres: buildGenres(myAlbums),
          };
        });

        get().syncLiveRoomToFirestore();
      },
      deleteAlbum: (albumId) => {
        if (!get().canEditAlbums || get().isViewingShared) return;

        set((state) => {
          const myAlbums = state.myAlbums.filter((album) => album.id !== albumId);
          const nextSelected = state.selectedAlbumId === albumId ? null : state.selectedAlbumId;
          return {
            myAlbums,
            albums: myAlbums,
            genres: buildGenres(myAlbums),
            selectedAlbumId: nextSelected,
          };
        });

        get().syncLiveRoomToFirestore();
      },
      replaceRoom: (newAlbums) => {
        if (!get().canEditAlbums || get().isViewingShared) return;
        set({
          myAlbums: newAlbums,
          albums: newAlbums,
          genres: buildGenres(newAlbums),
          selectedAlbumId: null,
          activeGenre: 'All',
        });

        get().syncLiveRoomToFirestore();
      },
      addToShelfFromCrate: (albumId) => {
        if (!get().canEditAlbums || get().isViewingShared) return;
        const targetAlbum = get().crateInbox.find(a => a.id === albumId);
        if (!targetAlbum) return;

        set((state) => {
          const myAlbums = [...state.myAlbums, targetAlbum];
          const crateInbox = state.crateInbox.filter(a => a.id !== albumId);
          return {
            myAlbums,
            albums: myAlbums,
            genres: buildGenres(myAlbums),
            crateInbox,
            selectedAlbumId: targetAlbum.id,
            activeGenre: 'All',
          };
        });

        get().syncLiveRoomToFirestore();
        get().backupRoomToCloud();
      },
      removeFromCrate: (albumId) => {
        set((state) => ({
          crateInbox: state.crateInbox.filter(a => a.id !== albumId)
        }));
        get().backupRoomToCloud();
      },
      clearCrate: () => {
        set({ crateInbox: [] });
        get().backupRoomToCloud();
      },
      loadSharedRoom: (ownerName, sharedAlbums) => {
        set({
          sharedOwnerName: ownerName,
          albums: sharedAlbums,
          genres: buildGenres(sharedAlbums),
          selectedAlbumId: null,
          activeGenre: 'All',
          isViewingShared: true,
        });
      },
      closeSharedRoom: () => {
        const myAlbums = get().myAlbums;
        set({
          sharedOwnerName: null,
          albums: myAlbums,
          genres: buildGenres(myAlbums),
          selectedAlbumId: null,
          activeGenre: 'All',
          isViewingShared: false,
          activeRoomPlayback: null,
        });
      },
      shareRoomToCloud: async () => {
        if (!isFirebaseConfigured || !db) {
          return { success: false, error: 'Firebase not configured' };
        }
        const albums = get().albums;
        const lightweight = albums.map(a => ({
          ...a,
          texture_url: a.texture_url?.startsWith('data:') ? '' : a.texture_url,
        }));
        const vaultName = get().vaultName || 'Anonymous';
        const user = get().user;
        const ownerUid = user ? user.uid : 'anonymous';
        try {
          const docRef = await addDoc(collection(db, 'shared_rooms'), {
            ownerName: vaultName,
            ownerUid,
            albums: lightweight,
            createdAt: Date.now()
          });
          return { success: true, id: docRef.id };
        } catch (err) {
          console.error('Failed to create shared room in Firestore:', err);
          return { success: false, error: err.message };
        }
      },
      fetchRoomFromDb: async (type, id) => {
        if (!isFirebaseConfigured || !db || !id) return false;
        try {
          let docSnap;
          if (type === 'live') {
            const docId = id.includes('_') ? id.trim() : id.toLowerCase().trim();
            docSnap = await getDoc(doc(db, 'community_rooms', docId));
          } else if (type === 'shared') {
            docSnap = await getDoc(doc(db, 'shared_rooms', id));
          }
          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            get().loadSharedRoom(data.ownerName, data.albums);
            
            // Subscriptions to live playback if available
            if (type === 'live') {
              // We return the unsubscribe handler so caller can cleanup
              return docSnap.id;
            }
            return true;
          }
        } catch (err) {
          console.error('Failed to fetch room from Firestore:', err);
        }
        return false;
      },
      publishRoom: async (description) => {
        const myAlbums = get().myAlbums;
        const vaultName = get().vaultName || 'Anonymous';
        const user = get().user;
        if (!user) return;
        const desc = description || 'No description provided.';
        const newRoom = {
          ownerName: vaultName,
          ownerUid: user.uid,
          roomName: `${vaultName}'s Room`,
          description: desc,
          genres: [...new Set(myAlbums.map((a) => a.genre))].slice(0, 3).join(', '),
          albums: myAlbums.map(a => ({
            ...a,
            texture_url: a.texture_url?.startsWith('data:') ? '' : a.texture_url,
          })),
          updatedAt: Date.now(),
        };

        set({
          isPublished: true,
          publishedDescription: desc,
          lastPublishedVaultName: vaultName,
          timelineError: null
        });

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, 'community_rooms', `${user.uid}_${get().activeRoomId}`), newRoom);
            await get().fetchTimelineRooms();
          } catch (err) {
            console.error('Failed to publish room to Firestore:', err);
            set({ timelineError: `Publish failed: ${err.message}` });
            set((state) => ({
              timelineRooms: [{ id: `${user.uid}_${get().activeRoomId}`, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== `${user.uid}_${get().activeRoomId}`)],
            }));
          }
        } else {
          const localId = `room-${user.uid}_${get().activeRoomId}`;
          set((state) => ({
            timelineRooms: [{ id: localId, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== localId)],
          }));
        }
      },
      syncLiveRoomToFirestore: async () => {
        if (!isFirebaseConfigured || !db) return;
        const { isPublished, myAlbums, vaultName, publishedDescription, user, activeRoomId } = get();
        if (!isPublished || !user) return;

        const newRoom = {
          ownerName: vaultName,
          ownerUid: user.uid,
          roomName: `${vaultName}'s Room`,
          description: publishedDescription || 'No description provided.',
          genres: [...new Set(myAlbums.map((a) => a.genre))].slice(0, 3).join(', '),
          albums: myAlbums.map(a => ({
            ...a,
            texture_url: a.texture_url?.startsWith('data:') ? '' : a.texture_url,
          })),
          updatedAt: Date.now(),
        };

        try {
          await setDoc(doc(db, 'community_rooms', `${user.uid}_${activeRoomId}`), newRoom, { merge: true });
          await get().fetchTimelineRooms();
        } catch (err) {
          console.error('Failed to sync live room to Firestore:', err);
          set({ timelineError: `Sync failed: ${err.message}` });
        }
      },
      unpublishRoom: async () => {
        const user = get().user;
        if (!user) return;

        set({
          isPublished: false,
          publishedDescription: '',
          lastPublishedVaultName: '',
          timelineError: null
        });

        if (isFirebaseConfigured && db) {
          try {
            await deleteDoc(doc(db, 'community_rooms', `${user.uid}_${get().activeRoomId}`));
            await get().fetchTimelineRooms();
          } catch (err) {
            console.error('Failed to delete live room from Firestore:', err);
            set({ timelineError: `Go offline failed: ${err.message}` });
          }
        } else {
          // If in local-only fallback mode, filter out the local room
          const localId = `room-${user.uid}_${get().activeRoomId}`;
          set((state) => ({
            timelineRooms: state.timelineRooms.filter((r) => r.id !== localId),
          }));
        }
      },
      fetchTimelineRooms: async () => {
        if (!isFirebaseConfigured || !db) return;
        try {
          const q = query(collection(db, 'community_rooms'), orderBy('updatedAt', 'desc'), limit(50));
          const querySnapshot = await getDocs(q);
          const rooms = [];
          querySnapshot.forEach((docSnap) => {
            rooms.push({ id: docSnap.id, ...docSnap.data() });
          });
          set({ timelineRooms: rooms, timelineError: null });
        } catch (err) {
          console.error('Failed to fetch rooms from Firestore:', err);
          set({ timelineError: `Load failed: ${err.message}` });
        }
      },
      subscribeToTimelineRooms: () => {
        if (!isFirebaseConfigured || !db) return () => {};
        try {
          const q = query(collection(db, 'community_rooms'), orderBy('updatedAt', 'desc'), limit(50));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const rooms = [];
            querySnapshot.forEach((docSnap) => {
              rooms.push({ id: docSnap.id, ...docSnap.data() });
            });
            set({ timelineRooms: rooms, timelineError: null });
          }, (err) => {
            console.error('Firestore real-time sync failed:', err);
            set({ timelineError: `Sync failed: ${err.message}` });
          });
          return unsubscribe;
        } catch (err) {
          console.error('Failed to subscribe to rooms from Firestore:', err);
          set({ timelineError: `Subscription failed: ${err.message}` });
          return () => {};
        }
      },
      backupRoomToCloud: async () => {
        if (!isFirebaseConfigured || !db) {
          return { success: false, error: 'Firebase is not initialized or configured' };
        }
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
        
        try {
          const docRef = doc(db, 'user_vaults', user.uid);
          const currentRooms = get().rooms.map(r => r.id === get().activeRoomId ? {
            ...r,
            name: get().vaultName,
            albums: get().myAlbums,
            description: get().publishedDescription,
            isPublished: get().isPublished
          } : r);
          
          await setDoc(docRef, {
            rooms: currentRooms,
            activeRoomId: get().activeRoomId,
            albums: get().myAlbums,
            crateInbox: get().crateInbox || [],
            vaultName: get().vaultName || user.displayName,
            updatedAt: Date.now(),
          });
          return { success: true };
        } catch (err) {
          console.error('Failed to backup room to cloud:', err);
          return { success: false, error: err.message };
        }
      },
      restoreRoomFromCloud: async () => {
        if (!isFirebaseConfigured || !db) {
          return { success: false, error: 'Firebase is not initialized or configured' };
        }
        const user = get().user;
        if (!user) return { success: false, error: 'Not authenticated' };
 
        try {
          const docRef = doc(db, 'user_vaults', user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            if (get().myAlbums.length > 0) {
              await get().backupRoomToCloud();
            }
            return { success: true, message: 'No remote backup existed, created default backup.' };
          }
          const data = docSnap.data();
          
          let restoredRooms = data.rooms;
          let restoredActiveId = data.activeRoomId;
          
          if (!restoredRooms || !Array.isArray(restoredRooms) || restoredRooms.length === 0) {
            restoredRooms = [{
              id: 'default',
              name: data.vaultName || 'My Room',
              albums: data.albums || [],
              description: '',
              isPublished: false
            }];
            restoredActiveId = 'default';
          }
          
          const activeRoom = restoredRooms.find(r => r.id === restoredActiveId) || restoredRooms[0];
          
          set({
            rooms: restoredRooms,
            activeRoomId: activeRoom.id,
            myAlbums: activeRoom.albums || [],
            albums: activeRoom.albums || [],
            crateInbox: data.crateInbox || [],
            genres: buildGenres(activeRoom.albums || []),
            vaultName: activeRoom.name || data.vaultName || get().vaultName || user.displayName,
            publishedDescription: activeRoom.description || '',
            isPublished: activeRoom.isPublished || false,
            selectedAlbumId: null,
            activeGenre: 'All',
          });
          return { success: true };
        } catch (err) {
          console.error('Failed to restore room from cloud:', err);
          return { success: false, error: err.message };
        }
      },
      setUser: (user) => set({ user }),
      setLastFmUsername: (name) => set({ lastFmUsername: name }),
      initializeAuth: () => {
        if (!isFirebaseConfigured || !auth) return null;
        return onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            set({
              user: {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous Selector',
                email: firebaseUser.email,
                isAnonymous: firebaseUser.isAnonymous
              }
            });
            get().restoreRoomFromCloud();
          } else {
            set({ user: null });
            signInAnonymously(auth).catch((err) => {
              console.error('Anonymous sign-in failed:', err);
            });
          }
        });
      },
      updateLivePlaybackState: async (playbackInfo) => {
        set({ livePlayback: playbackInfo });
        const { isPublished, user, activeRoomId } = get();
        if (isPublished && isFirebaseConfigured && db && user) {
          try {
            const docRef = doc(db, 'community_rooms', `${user.uid}_${activeRoomId}`);
            await setDoc(docRef, {
              activePlayback: playbackInfo
            }, { merge: true });
          } catch (err) {
            console.error('Failed to sync playback state to Firestore:', err);
          }
        }
      },
      addTrackToHistory: (track) => {
        if (!track) return;
        set((state) => {
          const prev = state.listeningHistory[0];
          if (prev && prev.trackTitle.toLowerCase() === track.trackTitle.toLowerCase() && prev.artistName.toLowerCase() === track.artistName.toLowerCase()) {
            return state;
          }
          return {
            listeningHistory: [track, ...state.listeningHistory].slice(0, 10)
          };
        });
      },
      subscribeToActiveRoomPlayback: (targetUid) => {
        if (!isFirebaseConfigured || !db || !targetUid) return () => {};
        try {
          const docRef = doc(db, 'community_rooms', targetUid);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              set({ activeRoomPlayback: data.activePlayback || null });
            }
          });
          return unsubscribe;
        } catch (err) {
          console.error('Failed to subscribe to active room playback:', err);
          return () => {};
        }
      },
      setSceneControl: (key, value) =>
        set((state) => ({
          sceneControls: {
            ...state.sceneControls,
            [key]: value,
          },
        })),
    }),
    {
      name: 'waxroom-store-v1',
      partialize: (state) => ({
        myAlbums: state.myAlbums,
        crateInbox: state.crateInbox,
        listeningHistory: state.listeningHistory,
        timelineRooms: state.timelineRooms,
        sceneControls: state.sceneControls,
        sceneControlsVersion,
        vaultName: state.vaultName,
        hasCompletedTour: state.hasCompletedTour,
        isPublished: state.isPublished,
        publishedDescription: state.publishedDescription,
        lastPublishedVaultName: state.lastPublishedVaultName,
        lastFmUsername: state.lastFmUsername,
        rooms: state.rooms,
        activeRoomId: state.activeRoomId,
        spotifyAccessToken: state.spotifyAccessToken,
        spotifyTokenExpiry: state.spotifyTokenExpiry,
      }),
      merge: (persistedState, currentState) => {
        const storedMyAlbums = persistedState?.myAlbums;
        const storedTimelineRooms = persistedState?.timelineRooms;
        const cleanMyAlbums = Array.isArray(storedMyAlbums) && storedMyAlbums.length > 0
          ? storedMyAlbums.filter(a => !!a.texture_url)
          : [];
        const myAlbums = cleanMyAlbums.length > 0 ? cleanMyAlbums : currentState.myAlbums;
        const timelineRooms = Array.isArray(storedTimelineRooms) && storedTimelineRooms.length > 0
          ? storedTimelineRooms
          : currentState.timelineRooms;
        const persistedControlsVersion = persistedState?.sceneControlsVersion ?? 1;
        const sceneControls = normalizeSceneControls(
          {
            ...currentState.sceneControls,
            ...(persistedState?.sceneControls ?? {}),
          },
          persistedControlsVersion < sceneControlsVersion
        );

        let rooms = Array.isArray(persistedState?.rooms) ? persistedState.rooms : [];
        let activeRoomId = persistedState?.activeRoomId ?? 'default';

        if (rooms.length === 0) {
          rooms = [{
            id: 'default',
            name: persistedState?.vaultName || 'My Room',
            albums: myAlbums,
            description: persistedState?.publishedDescription || '',
            isPublished: persistedState?.isPublished ?? false
          }];
          activeRoomId = 'default';
        }

        return {
          ...currentState,
          ...persistedState,
          myAlbums: rooms.find(r => r.id === activeRoomId)?.albums || myAlbums,
          albums: rooms.find(r => r.id === activeRoomId)?.albums || myAlbums,
          crateInbox: Array.isArray(persistedState?.crateInbox) ? persistedState.crateInbox : [],
          listeningHistory: Array.isArray(persistedState?.listeningHistory) ? persistedState.listeningHistory : [],
          genres: buildGenres(rooms.find(r => r.id === activeRoomId)?.albums || myAlbums),
          timelineRooms,
          sceneControls,
          sceneControlsVersion,
          isPublished: rooms.find(r => r.id === activeRoomId)?.isPublished ?? (persistedState?.isPublished ?? false),
          publishedDescription: rooms.find(r => r.id === activeRoomId)?.description ?? (persistedState?.publishedDescription ?? ''),
          lastPublishedVaultName: persistedState?.lastPublishedVaultName ?? '',
          lastFmUsername: persistedState?.lastFmUsername ?? '',
          rooms,
          activeRoomId,
          spotifyAccessToken: persistedState?.spotifyAccessToken ?? '',
          spotifyTokenExpiry: persistedState?.spotifyTokenExpiry ?? 0,
        };
      },
    }
  )
);
