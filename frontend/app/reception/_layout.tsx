import { RoleTabs } from "@/src/components/RoleTabs";
import { pendingCount, useQueueState } from "@/src/queue";

export default function ReceptionLayout() {
  const { data } = useQueueState();
  return (
    <RoleTabs
      roles={["reception"]}
      tabs={[
        { name: "index", title: "Today", icon: "today", sf: "list.bullet.rectangle.fill", badge: pendingCount(data) },
        { name: "availability", title: "Availability", icon: "people-circle", sf: "person.crop.circle.badge.checkmark" },
        { name: "history", title: "History", icon: "time", sf: "clock.fill" },
      ]}
    />
  );
}
