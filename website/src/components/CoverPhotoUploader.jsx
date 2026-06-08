export default function CoverPhotoUploader({ coverPreview, onFileSelect, inputId, compact, placeholderText }) {
  return (
    <div
      className={compact ? 'border border-dashed border-hairline-border rounded-lg p-sm cursor-pointer hover:bg-surface-container-low transition-colors' : 'border-2 border-dashed border-primary/20 rounded-xl p-4 cursor-pointer hover:bg-primary-fixed/20 transition-colors text-center group'}
      onClick={() => document.getElementById(inputId)?.click()}
      onKeyDown={(e) => e.key === 'Enter' && document.getElementById(inputId)?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
      {coverPreview ? (
        <img src={coverPreview} alt="" className={compact ? 'w-full h-32 object-cover rounded-lg' : 'w-full h-36 object-cover rounded-lg'} />
      ) : (
        compact ? (
          <p className="font-body-md text-on-surface-variant m-0 text-center py-md">{placeholderText || ''}</p>
        ) : (
          <div className="py-6 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary/40 group-hover:text-primary/60 transition-colors">add_photo_alternate</span>
            <p className="font-body-md text-on-surface-variant m-0">{placeholderText || 'Click to upload a cover image'}</p>
          </div>
        )
      )}
    </div>
  );
}
