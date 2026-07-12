import { FiTool } from "react-icons/fi";
import ModulePlaceholder from "./ModulePlaceholder";

export default function Maintenance() {
  return (
    <ModulePlaceholder
      icon={FiTool}
      title="Maintenance — not yet built"
      description="Maintenance log workflow that automatically moves a vehicle to In Shop and back to Available."
    />
  );
}
