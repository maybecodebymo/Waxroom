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
      setVaultName: async (name) => {
        const oldName = get().vaultName;
        const oldId = oldName?.toLowerCase().trim();
        const newId = name?.toLowerCase().trim();

        set({ vaultName: name });

        if (get().isPublished && oldId && newId && oldId !== newId) {
          if (isFirebaseConfigured && db) {
            try {
              await deleteDoc(doc(db, 'community_rooms', oldId));
              set({ lastPublishedVaultName: name });
              await get().syncLiveRoomToFirestore();
            } catch (err) {
              console.error('Failed to rename live room in Firestore:', err);
            }
          } else {
            set({ lastPublishedVaultName: name });
          }
        }
      },
      hasCompletedTour: false,
      setCompletedTour: (completed) => set({ hasCompletedTour: completed }),
      isRecommendationsOpen: false,
      setRecommendationsOpen: (isOpen) => set({ isRecommendationsOpen: isOpen }),
      isViewingShared: false,
      sharedOwnerName: null,
      timelineRooms: [],
      timelineError: null,
      isFeedOpen: false,
      setFeedOpen: (isOpen) => set({ isFeedOpen: isOpen }),
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
            docSnap = await getDoc(doc(db, 'community_rooms', id.toLowerCase().trim()));
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
            await setDoc(doc(db, 'community_rooms', user.uid), newRoom);
            await get().fetchTimelineRooms();
          } catch (err) {
            console.error('Failed to publish room to Firestore:', err);
            set({ timelineError: `Publish failed: ${err.message}` });
            set((state) => ({
              timelineRooms: [{ id: user.uid, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== user.uid)],
            }));
          }
        } else {
          const localId = `room-${user.uid}`;
          set((state) => ({
            timelineRooms: [{ id: localId, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== localId)],
          }));
        }
      },
      syncLiveRoomToFirestore: async () => {
        if (!isFirebaseConfigured || !db) return;
        const { isPublished, myAlbums, vaultName, publishedDescription, user } = get();
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
          await setDoc(doc(db, 'community_rooms', user.uid), newRoom, { merge: true });
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
            await deleteDoc(doc(db, 'community_rooms', user.uid));
            await get().fetchTimelineRooms();
          } catch (err) {
            console.error('Failed to delete live room from Firestore:', err);
            set({ timelineError: `Go offline failed: ${err.message}` });
          }
        } else {
          // If in local-only fallback mode, filter out the local room
          set((state) => ({
            timelineRooms: state.timelineRooms.filter((r) => r.id !== `room-${user.uid}`),
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
          await setDoc(docRef, {
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
            // Auto-backup local state if user has items but no cloud document yet
            if (get().myAlbums.length > 0) {
              await get().backupRoomToCloud();
            }
            return { success: true, message: 'No remote backup existed, created default backup.' };
          }
          const data = docSnap.data();
          set({
            myAlbums: data.albums || [],
            albums: data.albums || [],
            crateInbox: data.crateInbox || [],
            genres: buildGenres(data.albums || []),
            vaultName: data.vaultName || get().vaultName || user.displayName,
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
        if (!isFirebaseConfigured || !auth) return;
        onAuthStateChanged(auth, (firebaseUser) => {
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
        const { isPublished, user } = get();
        if (isPublished && isFirebaseConfigured && db && user) {
          try {
            const docRef = doc(db, 'community_rooms', user.uid);
            await setDoc(docRef, {
              activePlayback: playbackInfo
            }, { merge: true });
          } catch (err) {
            console.error('Failed to sync playback state to Firestore:', err);
          }
        }
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
        timelineRooms: state.timelineRooms,
        sceneControls: state.sceneControls,
        sceneControlsVersion,
        vaultName: state.vaultName,
        hasCompletedTour: state.hasCompletedTour,
        isPublished: state.isPublished,
        publishedDescription: state.publishedDescription,
        lastPublishedVaultName: state.lastPublishedVaultName,
        lastFmUsername: state.lastFmUsername,
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

        return {
          ...currentState,
          ...persistedState,
          myAlbums,
          albums: myAlbums,
          crateInbox: Array.isArray(persistedState?.crateInbox) ? persistedState.crateInbox : [],
          genres: buildGenres(myAlbums),
          timelineRooms,
          sceneControls,
          sceneControlsVersion,
          isPublished: persistedState?.isPublished ?? false,
          publishedDescription: persistedState?.publishedDescription ?? '',
          lastPublishedVaultName: persistedState?.lastPublishedVaultName ?? '',
          lastFmUsername: persistedState?.lastFmUsername ?? '',
        };
      },
    }
  )
);
