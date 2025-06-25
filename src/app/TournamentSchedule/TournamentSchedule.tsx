'use client';

import { useEffect, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  email: string;
}

interface Group {
  id: string;
  players: Player[];
}

interface Match {
  player1: string;
  player2: string;
  dueDate: string;
}

const examplePlayers = Array.from({ length: 30 }, (_, i) => ({ email: `player${i + 1}@example.com` }));

export default function TournamentScheduler() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupSize, setGroupSize] = useState(2);

  useEffect(() => {
    generateGroups(examplePlayers, groupSize);
  }, [groupSize]);

  const generateGroups = (players: { email: string }[], groupSize: number) => {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const newGroups: Group[] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      const groupPlayers = shuffled.slice(i, i + groupSize).map(p => ({ ...p, id: uuidv4() }));
      newGroups.push({ id: uuidv4(), players: groupPlayers });
    }
    setGroups(newGroups);
  };

  const createSchedule = () => {
    const newMatches: Match[] = [];
    const dueDate = new Date();
    groups.forEach(group => {
      const players = group.players;
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const matchDue = new Date(dueDate);
          matchDue.setDate(dueDate.getDate() + (i + j));
          newMatches.push({
            player1: players[i].email,
            player2: players[j].email,
            dueDate: matchDue.toISOString().split('T')[0],
          });
        }
      }
    });
    setMatches(newMatches);
  };

  const updateMatchDueDate = (index: number, newDate: string) => {
    const updatedMatches = [...matches];
    updatedMatches[index].dueDate = newDate;
    setMatches(updatedMatches);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceGroupIndex = groups.findIndex(group => group.players.some(p => p.id === active.id));
    const targetGroupIndex = groups.findIndex(group => group.players.some(p => p.id === over.id));

    if (sourceGroupIndex === -1 || targetGroupIndex === -1) return;

    const sourceGroup = groups[sourceGroupIndex];
    const targetGroup = groups[targetGroupIndex];

    const draggedPlayer = sourceGroup.players.find(p => p.id === active.id);
    if (!draggedPlayer) return;

    const newSourcePlayers = sourceGroup.players.filter(p => p.id !== active.id);
    const insertIndex = targetGroup.players.findIndex(p => p.id === over.id);
    const newTargetPlayers = [...targetGroup.players];
    newTargetPlayers.splice(insertIndex, 0, draggedPlayer);

    const newGroups = [...groups];
    newGroups[sourceGroupIndex] = { ...sourceGroup, players: newSourcePlayers };
    newGroups[targetGroupIndex] = { ...targetGroup, players: newTargetPlayers };

    setGroups(newGroups);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Tournament Scheduler</h1>

      <div className="flex items-center gap-4">
        <input
          type="number"
          value={groupSize}
          onChange={e => setGroupSize(Number(e.target.value))}
          className="w-24 p-2 border rounded"
        />
        <button onClick={() => generateGroups(examplePlayers, groupSize)} className="px-4 py-2 bg-blue-500 text-white rounded">
          Regenerate Groups
        </button>
        <button onClick={createSchedule} className="px-4 py-2 bg-green-500 text-white rounded">
          Create Match Schedule
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id} className="border p-4 rounded-xl bg-gray-50">
              <h2 className="font-semibold mb-2">Group</h2>
              <SortableContext items={group.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {group.players.map(player => (
                    <SortablePlayer key={player.id} player={player} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {matches.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Match Schedule</h2>
          <ul className="space-y-4">
            {matches.map((match, index) => (
              <li key={index} className="p-3 border rounded bg-white shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span>{match.player1} vs {match.player2}</span>
                  <label className="flex items-center gap-2">
                    Due Date:
                    <input
                      type="date"
                      value={match.dueDate}
                      onChange={e => updateMatchDueDate(index, e.target.value)}
                      className="border p-1 rounded"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SortablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-3 border rounded bg-white flex justify-between items-center shadow"
    >
      <span>{player.email}</span>
    </div>
  );
}
