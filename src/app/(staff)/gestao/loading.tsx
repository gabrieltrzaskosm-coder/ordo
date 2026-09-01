// Mantém a shell de Gestão interativa enquanto a próxima página busca dados
// dinâmicos. Este fallback também é prefetched pelo App Router, então o clique
// recebe resposta visual imediata em vez de conservar a tela anterior parada.
export default function GestaoLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando seção de gestão"
      className="mx-auto max-w-3xl px-4 py-6"
    >
      <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-surface-2" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
      <div className="mt-4 h-56 animate-pulse rounded-2xl border border-line bg-surface" />
    </main>
  );
}
