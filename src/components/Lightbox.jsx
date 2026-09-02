export default function Lightbox({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5"
    >
      <img src={src} alt="" className="max-h-full max-w-full rounded-md" />
    </div>
  );
}
