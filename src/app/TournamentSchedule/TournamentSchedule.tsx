"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";

interface Player {
  id: string;
  email: string;
  wins?: number;
  losses?: number;
  ties?: number;
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

const examplePlayers = [
  { email: "markeloboe@gmail.com" },
  { email: "luisrookie@hotmail.com" },
  { email: "carlospintado1982@gmail.com" },
  { email: "rodrigolaso_2@hotmail.com" },
  { email: "xandrepuig8@gmail.com" },

  { email: "anitwilightplay@gmail.com" },
  { email: "jaoct3@gmail.com" },
  { email: "hammermig@hotmail.com" },
  { email: "patxosans@gmail.com" },
  { email: "isidroararoyo@gmail.com" },
  { email: "eduardosans@hotmail.com" },
  { email: "pablovoinot@gmail.com" },
  { email: "jtamarit78@gmail.com" },
  { email: "fernandomurciano@gmail.com" },
  { email: "marcnunoespinosa@gmail.com" },
  { email: "toni.cebrian@gmail.com" },
  { email: "eneko.candal@gmail.com" },
  { email: "bidart.larrakoetxea@opendeusto.es" },
  { email: "jaribflores@gmail.com" },
  { email: "gcorcuera@gmail.com" },
  { email: "yiribon@gmail.com" },
  { email: "juanggomez91@gmail.com" },
  { email: "javicoca1@hotmail.com" },
  { email: "markeloboe@gmail.com" },
  { email: "luisrookie@hotmail.com" },
  { email: "carlospintado1982@gmail.com" },
  { email: "rodrigolaso_2@hotmail.com" },
  { email: "xandrepuig8@gmail.com" },

  { email: "anitwilightplay@gmail.com" },
  { email: "jaoct3@gmail.com" },
  { email: "hammermig@hotmail.com" },
  { email: "patxosans@gmail.com" },
  { email: "isidroararoyo@gmail.com" },
  { email: "eduardosans@hotmail.com" },
  { email: "pablovoinot@gmail.com" },
  { email: "jtamarit78@gmail.com" },
  { email: "fernandomurciano@gmail.com" },
  { email: "marcnunoespinosa@gmail.com" },
  { email: "toni.cebrian@gmail.com" },
  { email: "eneko.candal@gmail.com" },
  { email: "bidart.larrakoetxea@opendeusto.es" },
  { email: "jaribflores@gmail.com" },
  { email: "gcorcuera@gmail.com" },
  { email: "yiribon@gmail.com" },
  { email: "juanggomez91@gmail.com" },
  { email: "javicoca1@hotmail.com" },
];

export default function TournamentScheduler() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupLabels, setGroupLabels] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupSize, setGroupSize] = useState(6);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    generateGroups(examplePlayers, groupSize);
  }, [groupSize]);

  const generateGroups = (players: { email: string }[], groupSize: number) => {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const newGroups: Group[] = [];
    const newLabels: Record<string, number> = {};
    for (let i = 0; i < shuffled.length; i += groupSize) {
      const groupPlayers = shuffled.slice(i, i + groupSize).map((p) => ({
        ...p,
        id: uuidv4(),
        wins: 0,
        losses: 0,
        ties: 0,
      }));
      const groupId = uuidv4();
      newGroups.push({ id: groupId, players: groupPlayers });
      newLabels[groupId] = Math.floor(Math.random() * 1000); // random integer label
    }
    setGroups(newGroups);
    setGroupLabels(newLabels);
    setConfirmed(false);
    setMatches([]);
  };

  const createSchedule = () => {
    const newMatches: Match[] = [];
    const startDate = new Date();

    groups.forEach((group) => {
      const players = group.players;
      // // Map player email to their index in the group
      // const playerIndexMap = new Map(players.map((p, idx) => [p.email, idx]));

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          // Due date spaced by the max player index * 7 days
          const maxIndex = Math.max(i, j);
          const matchDue = new Date(startDate);
          matchDue.setDate(startDate.getDate() + maxIndex * 7);

          newMatches.push({
            player1: players[i].email,
            player2: players[j].email,
            dueDate: matchDue.toISOString().split("T")[0],
          });
        }
      }
    });

    setMatches(newMatches);
    setConfirmed(false);
  };

  const updateMatchDueDate = (index: number, newDate: string) => {
    if (confirmed) return; // Prevent changes if confirmed
    const updatedMatches = [...matches];
    updatedMatches[index].dueDate = newDate;
    setMatches(updatedMatches);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (confirmed) return; // disable drag when confirmed

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceGroupIndex = groups.findIndex((group) =>
      group.players.some((p) => p.id === active.id),
    );
    const targetGroupIndex = groups.findIndex((group) =>
      group.players.some((p) => p.id === over.id),
    );

    if (
      sourceGroupIndex === -1 ||
      targetGroupIndex === -1 ||
      sourceGroupIndex === targetGroupIndex
    ) {
      return;
    }

    const sourceGroup = groups[sourceGroupIndex];
    const targetGroup = groups[targetGroupIndex];

    const draggedPlayer = sourceGroup.players.find((p) => p.id === active.id);
    if (!draggedPlayer) return;

    const newSourcePlayers = sourceGroup.players.filter(
      (p) => p.id !== active.id,
    );
    const insertIndex = targetGroup.players.findIndex((p) => p.id === over.id);
    const newTargetPlayers = [...targetGroup.players];
    newTargetPlayers.splice(insertIndex, 0, draggedPlayer);

    const newGroups = [...groups];
    newGroups[sourceGroupIndex] = { ...sourceGroup, players: newSourcePlayers };
    newGroups[targetGroupIndex] = { ...targetGroup, players: newTargetPlayers };

    setGroups(newGroups);
  };

  const confirmSchedule = () => {
    setConfirmed(true);
  };

  // Helper: get matches belonging to a group based on players' emails
  const matchesByGroup = (group: Group) => {
    const playerEmails = new Set(group.players.map((p) => p.email));
    return matches.filter(
      (m) => playerEmails.has(m.player1) && playerEmails.has(m.player2),
    );
  };

  return (
    <div className="w-full p-4 space-y-6">
      <h1 className="text-2xl font-bold">Tournament Scheduler</h1>

      <div className="flex items-center gap-4">
        <input
          type="number"
          value={groupSize}
          onChange={(e) => setGroupSize(Number(e.target.value))}
          className="w-24 p-2 border rounded"
          disabled={confirmed}
        />
        <button
          onClick={() => generateGroups(examplePlayers, groupSize)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={confirmed}
        >
          Regenerate Groups
        </button>
        <button
          onClick={createSchedule}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={confirmed}
        >
          Create Match Schedule
        </button>
        <button
          onClick={confirmSchedule}
          className="px-4 py-2 bg-red-600 text-white rounded"
          disabled={confirmed || matches.length === 0}
        >
          Confirm Schedule
        </button>
      </div>

      {/* Display match schedules grouped by each group */}
      {matches.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-xl font-semibold mb-4">Match Schedule</h2>
          {groups.map((group) => (
            <div key={group.id}>
              <h3 className="text-lg font-semibold mb-2">
                Group {groupLabels[group.id]} Schedule
              </h3>
              <ul className="space-y-2">
                {matchesByGroup(group).map((match, index) => (
                  <li
                    key={index}
                    className="p-3 border rounded bg-white shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <span>
                        {match.player1} vs {match.player2}
                      </span>
                      <label className="flex items-center gap-2">
                        Due Date:
                        <input
                          type="date"
                          value={match.dueDate}
                          onChange={(e) =>
                            updateMatchDueDate(
                              matches.indexOf(match),
                              e.target.value,
                            )
                          }
                          className="border p-1 rounded"
                          disabled={confirmed}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border p-2 rounded-md bg-gray-50 w-64"
            >
              <h2 className="font-semibold mb-2">
                Group {groupLabels[group.id]}
              </h2>
              <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2 mb-2">
                <div>Player</div>
                {confirmed && (
                  <>
                    <div>Wins</div>
                    <div>Losses</div>
                    <div>Ties</div>
                  </>
                )}
              </div>
              <SortableContext
                items={group.players.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-4">
                  {group.players.map((player) => (
                    <SortablePlayer
                      key={player.id}
                      player={player}
                      confirmed={confirmed}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function SortablePlayer({
  player,
  confirmed,
}: {
  player: Player;
  confirmed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: confirmed ? "default" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-2 border rounded bg-white flex justify-between items-center text-sm"
    >
      <div className="w-1/2">{player.email}</div>
      {confirmed && (
        <>
          <div className="w-1/6 text-center">{player.wins ?? 0}</div>
          <div className="w-1/6 text-center">{player.losses ?? 0}</div>
          <div className="w-1/6 text-center">{player.ties ?? 0}</div>
        </>
      )}
    </div>
  );
}
