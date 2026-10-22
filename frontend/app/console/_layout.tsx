import { RoleTabs } from "@/src/components/RoleTabs";
import { pendingCount, useQueueState } from "@/src/queue";

export default function ConsoleLayout() {
  const { data } = useQueueState();
  const pending = pendingCount(data);
  return (
    <RoleTabs
      roles={["md", "host"]}
      tabs={[
        { name: "index", title: "Home", icon: "home", sf: "house.fill" },
        { name: "requests", title: "Requests", icon: "mail-unread", sf: "tray.full.fill", badge: pending },
        { name: "queue", title: "Queue", icon: "people", sf: "person.3.fill" },
        { name: "status", title: "Status", icon: "radio-button-on", sf: "dot.radiowaves.left.and.right" },
      ]}
    />
  );
}
