import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isoDate } from '@/lib/mood';
import {
  createId,
  defaultKleurForIndex,
  EMPTY_WAARDEN_DATA,
  isCollectionScope,
  normalizeWaardenData,
} from '@/lib/waarden';
import {
  deleteActieRemote,
  deleteBarriereRemote,
  deleteWaardeRemote,
  fetchWaardenData,
  insertActie,
  insertBarriere,
  insertWaarde,
  loadWaardenWithMigration,
  updateActieRemote,
  updateBarriereRemote,
  updateWaardeRemote,
  upsertCheckinRemote,
} from '@/lib/waarden-queries';
import { useAuth } from '@/providers/AuthProvider';
import type {
  BarriereType,
  Waarde,
  WaardeActie,
  WaardeBarriere,
  WaardeCheckinAntwoord,
  WaardenData,
  WaardeTermijn,
} from '@/types/waarden';

interface WaardenContextValue {
  data: WaardenData;
  loading: boolean;
  addWaarde: (input: { naam: string; beschrijving: string; kleur: string }) => Waarde;
  addWaarden: (inputs: Array<{ naam: string; beschrijving?: string; kleur?: string }>) => Waarde[];
  updateWaarde: (id: string, input: { naam: string; beschrijving: string; kleur: string }) => void;
  updateWaardeBeschrijving: (id: string, beschrijving: string) => void;
  deleteWaarde: (id: string) => void;
  addActie: (termijn: WaardeTermijn, actie: string) => void;
  updateActie: (actie: WaardeActie) => void;
  deleteActie: (id: string) => void;
  reviewActie: (
    actieId: string,
    review: {
      behaald: boolean;
      beschrijving: string;
      nieuweActie?: string;
    },
  ) => void;
  addBarriere: (type: BarriereType, omschrijving: string, eigenLabel?: string) => void;
  updateBarriere: (barriere: WaardeBarriere) => void;
  deleteBarriere: (id: string) => void;
  addCheckin: (input: { datum: string; antwoord: WaardeCheckinAntwoord; notitie: string }) => void;
}

const WaardenContext = createContext<WaardenContextValue | null>(null);

export function WaardenProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WaardenData>(EMPTY_WAARDEN_DATA);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setData(EMPTY_WAARDEN_DATA);
      return;
    }
    const fresh = await fetchWaardenData(user.id);
    setData(normalizeWaardenData(fresh));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setData(EMPTY_WAARDEN_DATA);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const stored = await loadWaardenWithMigration(user.id, user.email);
        if (!cancelled) {
          setData(normalizeWaardenData(stored));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setData(EMPTY_WAARDEN_DATA);
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addWaarde = useCallback(
    (input: { naam: string; beschrijving: string; kleur: string }) => {
      const waarde: Waarde = {
        id: createId(),
        naam: input.naam.trim(),
        beschrijving: input.beschrijving.trim(),
        kleur: input.kleur,
      };
      setData((prev) => normalizeWaardenData({ ...prev, waarden: [...prev.waarden, waarde] }));
      if (user) {
        void insertWaarde(user.id, user.email, waarde).catch(() => {
          void reload();
        });
      }
      return waarde;
    },
    [user, reload],
  );

  const updateWaarde = useCallback(
    (id: string, input: { naam: string; beschrijving: string; kleur: string }) => {
      const updated: Waarde = {
        id,
        naam: input.naam.trim(),
        beschrijving: input.beschrijving.trim(),
        kleur: input.kleur,
      };
      setData((prev) =>
        normalizeWaardenData({
          ...prev,
          waarden: prev.waarden.map((w) => (w.id === id ? updated : w)),
        }),
      );
      if (user) {
        void updateWaardeRemote(user.id, updated).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const updateWaardeBeschrijving = useCallback(
    (id: string, beschrijving: string) => {
      setData((prev) => {
        const existing = prev.waarden.find((w) => w.id === id);
        if (!existing) return prev;
        const updated: Waarde = { ...existing, beschrijving: beschrijving.trim() };
        if (user) {
          void updateWaardeRemote(user.id, updated).catch(() => {
            void reload();
          });
        }
        return normalizeWaardenData({
          ...prev,
          waarden: prev.waarden.map((w) => (w.id === id ? updated : w)),
        });
      });
    },
    [user, reload],
  );

  const deleteWaarde = useCallback(
    (id: string) => {
      setData((prev) =>
        normalizeWaardenData({
          ...prev,
          waarden: prev.waarden.filter((w) => w.id !== id),
        }),
      );
      if (user) {
        void deleteWaardeRemote(user.id, id).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const addWaarden = useCallback(
    (inputs: Array<{ naam: string; beschrijving?: string; kleur?: string }>) => {
      const created: Waarde[] = inputs
        .map((input, index) => {
          const naam = input.naam.trim();
          if (!naam) return null;
          return {
            id: createId(),
            naam,
            beschrijving: input.beschrijving?.trim() ?? '',
            kleur: input.kleur ?? defaultKleurForIndex(data.waarden.length + index),
          } satisfies Waarde;
        })
        .filter((item): item is Waarde => item !== null);

      if (created.length === 0) return [];

      setData((prev) => normalizeWaardenData({ ...prev, waarden: [...prev.waarden, ...created] }));

      if (user) {
        for (const waarde of created) {
          void insertWaarde(user.id, user.email, waarde).catch(() => {
            void reload();
          });
        }
      }

      return created;
    },
    [data.waarden.length, user, reload],
  );

  const addActie = useCallback(
    (termijn: WaardeTermijn, actie: string) => {
      const trimmed = actie.trim();
      if (!trimmed) return;
      const item: WaardeActie = {
        id: createId(),
        waarde_id: null,
        termijn,
        actie: trimmed,
        aangemaakt_op: isoDate(),
      };
      setData((prev) => normalizeWaardenData({ ...prev, acties: [...prev.acties, item] }));
      if (user) {
        void insertActie(user.id, user.email, item).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const reviewActie = useCallback(
    (
      actieId: string,
      review: {
        behaald: boolean;
        beschrijving: string;
        nieuweActie?: string;
      },
    ) => {
      setData((prev) => {
        const target = prev.acties.find((item) => item.id === actieId);
        if (!target) return prev;

        const reviewed: WaardeActie = {
          ...target,
          beoordeling: {
            behaald: review.behaald,
            beschrijving: review.beschrijving.trim(),
            beoordeeld_op: isoDate(),
          },
        };

        const nieuweActie = review.nieuweActie?.trim();
        const extraActie: WaardeActie | null = nieuweActie
          ? {
              id: createId(),
              waarde_id: null,
              termijn: target.termijn,
              actie: nieuweActie,
              aangemaakt_op: isoDate(),
            }
          : null;

        const next = normalizeWaardenData({
          ...prev,
          acties: [
            ...prev.acties.map((item) => (item.id === actieId ? reviewed : item)),
            ...(extraActie ? [extraActie] : []),
          ],
        });

        if (user) {
          void (async () => {
            try {
              await updateActieRemote(user.id, reviewed);
              if (extraActie) {
                await insertActie(user.id, user.email, extraActie);
              }
            } catch {
              await reload();
            }
          })();
        }

        return next;
      });
    },
    [user, reload],
  );

  const updateActie = useCallback(
    (actie: WaardeActie) => {
      const trimmed = actie.actie.trim();
      if (!trimmed) return;
      const updated = { ...actie, actie: trimmed };
      setData((prev) =>
        normalizeWaardenData({
          ...prev,
          acties: prev.acties.map((item) => (item.id === actie.id ? updated : item)),
        }),
      );
      if (user) {
        void updateActieRemote(user.id, updated).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const deleteActie = useCallback(
    (id: string) => {
      setData((prev) =>
        normalizeWaardenData({ ...prev, acties: prev.acties.filter((a) => a.id !== id) }),
      );
      if (user) {
        void deleteActieRemote(user.id, id).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const addBarriere = useCallback(
    (type: BarriereType, omschrijving: string, eigenLabel?: string) => {
      const trimmed = omschrijving.trim();
      if (!trimmed) return;
      const trimmedEigen = eigenLabel?.trim();
      if (type === 'eigen' && !trimmedEigen) return;

      const item: WaardeBarriere = {
        id: createId(),
        waarde_id: null,
        type,
        omschrijving: trimmed,
        aangemaakt_op: isoDate(),
        ...(type === 'eigen' && trimmedEigen ? { eigenLabel: trimmedEigen } : {}),
      };
      setData((prev) => normalizeWaardenData({ ...prev, barriers: [...prev.barriers, item] }));
      if (user) {
        void insertBarriere(user.id, user.email, item).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const updateBarriere = useCallback(
    (barriere: WaardeBarriere) => {
      const trimmed = barriere.omschrijving.trim();
      if (!trimmed) return;
      const trimmedEigen = barriere.eigenLabel?.trim();
      if (barriere.type === 'eigen' && !trimmedEigen) return;

      const updated: WaardeBarriere = {
        ...barriere,
        omschrijving: trimmed,
        ...(barriere.type === 'eigen' && trimmedEigen ? { eigenLabel: trimmedEigen } : {}),
      };
      setData((prev) =>
        normalizeWaardenData({
          ...prev,
          barriers: prev.barriers.map((item) => (item.id === barriere.id ? updated : item)),
        }),
      );
      if (user) {
        void updateBarriereRemote(user.id, updated).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const deleteBarriere = useCallback(
    (id: string) => {
      setData((prev) =>
        normalizeWaardenData({ ...prev, barriers: prev.barriers.filter((b) => b.id !== id) }),
      );
      if (user) {
        void deleteBarriereRemote(user.id, id).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const addCheckin = useCallback(
    (input: { datum: string; antwoord: WaardeCheckinAntwoord; notitie: string }) => {
      const item = {
        id: createId(),
        waarde_id: null,
        datum: input.datum,
        antwoord: input.antwoord,
        notitie: input.notitie.trim(),
      };
      setData((prev) =>
        normalizeWaardenData({
          ...prev,
          checkins: [
            ...prev.checkins.filter(
              (c) => !(isCollectionScope(c.waarde_id) && c.datum === input.datum),
            ),
            item,
          ],
        }),
      );
      if (user) {
        void upsertCheckinRemote(user.id, user.email, item).catch(() => {
          void reload();
        });
      }
    },
    [user, reload],
  );

  const value = useMemo(
    () => ({
      data,
      loading,
      addWaarde,
      addWaarden,
      updateWaarde,
      updateWaardeBeschrijving,
      deleteWaarde,
      addActie,
      updateActie,
      deleteActie,
      reviewActie,
      addBarriere,
      updateBarriere,
      deleteBarriere,
      addCheckin,
    }),
    [
      data,
      loading,
      addWaarde,
      addWaarden,
      updateWaarde,
      updateWaardeBeschrijving,
      deleteWaarde,
      addActie,
      updateActie,
      deleteActie,
      reviewActie,
      addBarriere,
      updateBarriere,
      deleteBarriere,
      addCheckin,
    ],
  );

  return <WaardenContext.Provider value={value}>{children}</WaardenContext.Provider>;
}

export function useWaarden(): WaardenContextValue {
  const context = useContext(WaardenContext);
  if (!context) {
    throw new Error('useWaarden must be used within WaardenProvider');
  }
  return context;
}
