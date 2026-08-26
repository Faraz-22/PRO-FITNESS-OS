'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { recordWorkoutSetAction } from '@/app/actions/fitness.actions';

export function WorkoutSetRow({
  sessionExerciseId,
  setNumber,
  targetWeight,
  targetReps,
  initialWeight,
  initialReps,
  completed = false
}: {
  sessionExerciseId: string;
  setNumber: number;
  targetWeight?: number | null;
  targetReps?: number | null;
  initialWeight?: number | null;
  initialReps?: number | null;
  completed?: boolean;
}) {
  const [weight, setWeight] = useState<string>(initialWeight?.toString() ?? targetWeight?.toString() ?? '');
  const [reps, setReps] = useState<string>(initialReps?.toString() ?? targetReps?.toString() ?? '');
  const [isCompleted, setIsCompleted] = useState(completed);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      await recordWorkoutSetAction(sessionExerciseId, {
        setNumber,
        weightUsed: weight ? Number(weight) : undefined,
        repsCompleted: reps ? Number(reps) : undefined,
      });
      setIsCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`grid grid-cols-[1fr_2fr_2fr_auto] gap-3 items-center py-3 border-b border-zinc-800/50 ${isCompleted ? 'opacity-50' : ''}`}>
      <div className="text-zinc-400 font-medium text-center text-lg">{setNumber}</div>
      <div>
        <Input 
          type="number" 
          inputMode="decimal"
          pattern="[0-9]*"
          value={weight} 
          onChange={e => setWeight(e.target.value)}
          disabled={isCompleted || loading}
          className="bg-zinc-900 border-zinc-700 focus:border-amber-500 text-zinc-100 text-center h-12 text-lg rounded-xl"
          placeholder="kg"
        />
      </div>
      <div>
        <Input 
          type="number" 
          inputMode="numeric"
          pattern="[0-9]*"
          value={reps} 
          onChange={e => setReps(e.target.value)}
          disabled={isCompleted || loading}
          className="bg-zinc-900 border-zinc-700 focus:border-amber-500 text-zinc-100 text-center h-12 text-lg rounded-xl"
          placeholder="reps"
        />
      </div>
      <div className="flex justify-end pl-1">
        <Button 
          size="icon" 
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted || loading}
          onClick={handleComplete}
          className={`h-12 w-12 rounded-xl flex-shrink-0 ${!isCompleted ? "bg-amber-600 hover:bg-amber-500 text-zinc-950" : "bg-zinc-800 text-emerald-500"}`}
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

export function WorkoutExerciseCard({
  exercise
}: {
  exercise: any; // We'll pass the WorkoutSessionExercise object here
}) {
  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 text-zinc-100 mb-6 overflow-hidden rounded-2xl shadow-lg">
      <CardHeader className="bg-zinc-900/50 pb-4 border-b border-zinc-800/50">
        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-amber-500">{exercise.exerciseNameSnapshot}</CardTitle>
        <p className="text-sm text-zinc-400 mt-1">
          Target: <span className="font-medium text-zinc-300">{exercise.targetSetsSnapshot} sets × {exercise.targetRepsSnapshot} reps</span> 
          {exercise.targetWeightSnapshot ? <span className="font-medium text-zinc-300"> @ {exercise.targetWeightSnapshot}kg</span> : ''}
        </p>
      </CardHeader>
      <CardContent className="pt-4 p-0">
        <div className="px-4 grid grid-cols-[1fr_2fr_2fr_auto] gap-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase text-center tracking-wider">
          <div>Set</div>
          <div>Weight</div>
          <div>Reps</div>
          <div className="text-right pr-4">Done</div>
        </div>
        <div className="px-4 pb-4">
          {Array.from({ length: exercise.targetSetsSnapshot || 3 }).map((_, i) => {
            const setNumber = i + 1;
            const existingSet = exercise.sets?.find((s: any) => s.setNumber === setNumber);
            return (
              <WorkoutSetRow
                key={`${exercise.id}-${setNumber}`}
                sessionExerciseId={exercise.id}
                setNumber={setNumber}
                targetWeight={Number(exercise.targetWeightSnapshot)}
                targetReps={exercise.targetRepsSnapshot}
                initialWeight={existingSet ? Number(existingSet.weightUsed) : null}
                initialReps={existingSet?.repsCompleted}
                completed={existingSet?.completed}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
