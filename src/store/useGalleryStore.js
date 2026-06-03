import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { baseGenres, mockAlbums } from '../data/mockAlbums';
import { mockRooms } from '../data/mockRooms';

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
      myAlbums: mockAlbums,
      albums: mockAlbums,
      genres: baseGenres,
      selectedAlbumId: null,
      activeGenre: 'All',
      isAddModalOpen: false,
      editingAlbumId: null,
      canEditAlbums: true,
      sceneControls: defaultSceneControls,
      sceneControlsVersion,
      vaultName: '',
      setVaultName: (name) => set({ vaultName: name }),
      hasCompletedTour: false,
      setCompletedTour: (completed) => set({ hasCompletedTour: completed }),
      isRecommendationsOpen: false,
      setRecommendationsOpen: (isOpen) => set({ isRecommendationsOpen: isOpen }),
      isViewingShared: false,
      sharedOwnerName: null,
      timelineRooms: mockRooms,
      isFeedOpen: false,
      setFeedOpen: (isOpen) => set({ isFeedOpen: isOpen }),
      toggleEditMode: () => set((state) => ({ canEditAlbums: !state.canEditAlbums })),
      selectAlbum: (albumId) => set({ selectedAlbumId: albumId }),
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
      },
      deleteAlbum: (albumId) => {
        if (!get().canEditAlbums || get().isViewingShared) return;

        set((state) => {
          const myAlbums = state.myAlbums.filter((album) => album.id !== albumId);
          const nextSelected = state.selectedAlbumId === albumId ? null : state.selectedAlbumId;
          const finalMyAlbums = myAlbums.length ? myAlbums : mockAlbums;
          return {
            myAlbums: finalMyAlbums,
            albums: finalMyAlbums,
            genres: buildGenres(finalMyAlbums),
            selectedAlbumId: nextSelected,
          };
        });
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
      publishRoom: (description) => {
        const myAlbums = get().myAlbums;
        const vaultName = get().vaultName || 'Anonymous';
        const newRoom = {
          id: `room-${Date.now()}`,
          ownerName: vaultName,
          roomName: `${vaultName}'s Room`,
          description: description || 'No description provided.',
          genres: [...new Set(myAlbums.map((a) => a.genre))].slice(0, 3).join(', '),
          albums: myAlbums,
        };
        set((state) => ({
          timelineRooms: [newRoom, ...state.timelineRooms],
        }));
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
        };
      },
    }
  )
);
