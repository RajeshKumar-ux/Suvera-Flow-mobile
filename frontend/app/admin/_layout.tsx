import { RoleTabs } from "@/src/components/RoleTabs";
import { pendingCount, useQueueState } from "@/src/queue";

export default function AdminLayout() {
  const { data } = useQueueState();
  return (
    <RoleTabs
      roles={["admin"]}
      tabs={[
        { name: "index", title: "Overview", icon: "grid", sf: "square.grid.2x2.fill" },
        { name: "people", title: "People", icon: "people", sf: "person.2.fill" },
        { name: "control", title: "Control", icon: "toggle", sf: "switch.2" },
        { name: "queue", title: "Queue", icon: "list", sf: "list.number", badge: pendingCount(data) },
      ]}
    />
  );
}
