export default function Placeholder({ title, note }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="card bg-base-100 shadow">
        <div className="card-body items-center text-center py-16">
          <div className="text-4xl opacity-30">🚧</div>
          <p className="opacity-60 max-w-md">{note}</p>
        </div>
      </div>
    </div>
  );
}
