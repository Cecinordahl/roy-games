import { useEffect, useState } from 'react';
import { subscribeTable, subscribeTables } from '../data/tablesRepo';
import type { TableDoc, WithId } from '../data/types';

export function useTables(tournamentId: string | undefined, stageId: string | undefined): WithId<TableDoc>[] {
  const [tables, setTables] = useState<WithId<TableDoc>[]>([]);

  useEffect(() => {
    if (!tournamentId || !stageId) return;
    setTables([]);
    return subscribeTables(tournamentId, stageId, setTables);
  }, [tournamentId, stageId]);

  return tables;
}

export function useTable(
  tournamentId: string | undefined,
  stageId: string | undefined,
  tableId: string | undefined,
): WithId<TableDoc> | null | undefined {
  const [table, setTable] = useState<WithId<TableDoc> | null | undefined>(undefined);

  useEffect(() => {
    if (!tournamentId || !stageId || !tableId) return;
    setTable(undefined);
    return subscribeTable(tournamentId, stageId, tableId, setTable);
  }, [tournamentId, stageId, tableId]);

  return table;
}
