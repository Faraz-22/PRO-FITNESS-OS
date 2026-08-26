import React from 'react';

export function ProgressPhotoGrid({ photos }: { photos: any[] }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-zinc-500">No progress photos available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          {/* Note: In a real app this would use next/image with a secure signed URL */}
          {photo.photoUrl ? (
            <img 
              src={photo.photoUrl} 
              alt={photo.photoType} 
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-600">
              [Image Placeholder]
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent p-3">
            <p className="text-xs font-medium text-white">{photo.photoType}</p>
            <p className="text-[10px] text-zinc-400">{new Date(photo.capturedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
