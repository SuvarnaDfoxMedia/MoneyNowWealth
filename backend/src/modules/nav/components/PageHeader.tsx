type PageHeaderProps = {
  title: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
