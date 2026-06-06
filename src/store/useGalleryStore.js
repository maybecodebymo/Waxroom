import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, isFirebaseConfigured } from '../utils/firebase';
import { collection, addDoc, getDocs, getDoc, setDoc, doc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';

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
      genres: ['All'],
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
        });
      },
      publishRoom: async (description) => {
        const myAlbums = get().myAlbums;
        const vaultName = get().vaultName || 'Anonymous';
        const vaultId = vaultName.toLowerCase().trim();
        const desc = description || 'No description provided.';
        const newRoom = {
          ownerName: vaultName,
          roomName: `${vaultName}'s Room`,
          description: desc,
          genres: [...new Set(myAlbums.map((a) => a.genre))].slice(0, 3).join(', '),
          albums: myAlbums,
          updatedAt: Date.now(),
        };

        set({
          isPublished: true,
          publishedDescription: desc,
          lastPublishedVaultName: vaultName,
          timelineError: null
        });

        if (isFirebaseConfigured && db && vaultId) {
          try {
            await setDoc(doc(db, 'community_rooms', vaultId), newRoom);
            await get().fetchTimelineRooms();
          } catch (err) {
            console.error('Failed to publish room to Firestore:', err);
            set({ timelineError: `Publish failed: ${err.message}` });
            set((state) => ({
              timelineRooms: [{ id: `room-${vaultId}`, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== `room-${vaultId}`)],
            }));
          }
        } else {
          const localId = `room-${vaultId || Date.now()}`;
          set((state) => ({
            timelineRooms: [{ id: localId, ...newRoom }, ...state.timelineRooms.filter(r => r.id !== localId)],
          }));
        }
      },
      syncLiveRoomToFirestore: async () => {
        if (!isFirebaseConfigured || !db) return;
        const { isPublished, myAlbums, vaultName, publishedDescription } = get();
        if (!isPublished) return;
        
        const vaultId = vaultName?.toLowerCase().trim();
        if (!vaultId) return;

        const newRoom = {
          ownerName: vaultName,
          roomName: `${vaultName}'s Room`,
          description: publishedDescription || 'No description provided.',
          genres: [...new Set(myAlbums.map((a) => a.genre))].slice(0, 3).join(', '),
          albums: myAlbums,
          updatedAt: Date.now(),
        };

        try {
          await setDoc(doc(db, 'community_rooms', vaultId), newRoom);
          await get().fetchTimelineRooms();
        } catch (err) {
          console.error('Failed to sync live room to Firestore:', err);
          set({ timelineError: `Sync failed: ${err.message}` });
        }
      },
      unpublishRoom: async (customVaultId) => {
        const { lastPublishedVaultName, vaultName } = get();
        let vaultId = customVaultId || lastPublishedVaultName?.toLowerCase().trim() || vaultName?.toLowerCase().trim();

        if (vaultId && vaultId.startsWith('room-')) {
          vaultId = vaultId.substring(5);
        }

        set({
          isPublished: false,
          publishedDescription: '',
          lastPublishedVaultName: '',
          timelineError: null
        });

        if (isFirebaseConfigured && db) {
          try {
            if (vaultId) {
              await deleteDoc(doc(db, 'community_rooms', vaultId));
            }

            // Query to find and clean up any other duplicates under the same owner names
            const q = query(collection(db, 'community_rooms'));
            const querySnapshot = await getDocs(q);
            const deletePromises = [];
            querySnapshot.forEach((docSnap) => {
              if (docSnap.id === vaultId) return;

              const data = docSnap.data();
              const owner = data.ownerName?.toLowerCase().trim();
              const targetOwner1 = vaultName?.toLowerCase().trim();
              const targetOwner2 = lastPublishedVaultName?.toLowerCase().trim();
              if (owner === targetOwner1 || owner === targetOwner2) {
                deletePromises.push(deleteDoc(doc(db, 'community_rooms', docSnap.id)));
              }
            });

            if (deletePromises.length > 0) {
              await Promise.all(deletePromises);
            }
          } catch (err) {
            console.error('Failed to delete live room from Firestore:', err);
            set({ timelineError: `Go offline failed: ${err.message}` });
          }
        }

        if (isFirebaseConfigured && db) {
          await get().fetchTimelineRooms();
        } else {
          // If in local-only fallback mode, filter out the local room
          set((state) => ({
            timelineRooms: state.timelineRooms.filter((r) => 
              r.id !== `room-${vaultId}` && 
              r.id !== customVaultId && 
              !r.id.includes(vaultId)
            ),
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
      backupRoomToCloud: async () => {
        if (!isFirebaseConfigured || !db) {
          return { success: false, error: 'Firebase is not initialized or configured' };
        }
        const vaultName = get().vaultName?.trim();
        if (!vaultName) return { success: false, error: 'Please set a room name first' };
        
        try {
          const docRef = doc(db, 'user_vaults', vaultName.toLowerCase());
          await setDoc(docRef, {
            albums: get().myAlbums,
            vaultName: vaultName,
            updatedAt: Date.now(),
          });
          return { success: true };
        } catch (err) {
          console.error('Failed to backup room to cloud:', err);
          return { success: false, error: err.message };
        }
      },
      restoreRoomFromCloud: async (targetName) => {
        if (!isFirebaseConfigured || !db) {
          return { success: false, error: 'Firebase is not initialized or configured' };
        }
        const name = targetName?.trim() || get().vaultName?.trim();
        if (!name) return { success: false, error: 'Please enter a room name to restore' };

        try {
          const docRef = doc(db, 'user_vaults', name.toLowerCase());
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            return { success: false, error: 'No backed-up room found with that name' };
          }
          const data = docSnap.data();
          set({
            myAlbums: data.albums || [],
            albums: data.albums || [],
            genres: buildGenres(data.albums || []),
            vaultName: data.vaultName || name,
            selectedAlbumId: null,
            activeGenre: 'All',
          });
          return { success: true };
        } catch (err) {
          console.error('Failed to restore room from cloud:', err);
          return { success: false, error: err.message };
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
        timelineRooms: state.timelineRooms,
        sceneControls: state.sceneControls,
        sceneControlsVersion,
        vaultName: state.vaultName,
        hasCompletedTour: state.hasCompletedTour,
        isPublished: state.isPublished,
        publishedDescription: state.publishedDescription,
        lastPublishedVaultName: state.lastPublishedVaultName,
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
          genres: buildGenres(myAlbums),
          timelineRooms,
          sceneControls,
          sceneControlsVersion,
          isPublished: persistedState?.isPublished ?? false,
          publishedDescription: persistedState?.publishedDescription ?? '',
          lastPublishedVaultName: persistedState?.lastPublishedVaultName ?? '',
        };
      },
    }
  )
);
