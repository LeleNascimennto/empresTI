type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 rounded-[12px] border border-[#1F2949] bg-[#0E1530] p-8 shadow-[0_0_0_1px_#222C4A]">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8AA6EE]">
        EmpresTI
      </p>
      <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-[#E6EAF6]">{title}</h1>
      <p className="max-w-[56ch] text-sm leading-6 text-[#9AA3BC]">
        {description ?? "Estrutura inicial pronta. Esta tela será implementada em uma tarefa própria."}
      </p>
    </section>
  );
}
