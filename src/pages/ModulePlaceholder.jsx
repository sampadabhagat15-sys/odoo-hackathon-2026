import EmptyState from "../components/ui/EmptyState";

export default function ModulePlaceholder({ icon, title, description }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        icon={icon}
        title={title}
        description={description || "This module will be built in an upcoming step."}
      />
    </div>
  );
}
