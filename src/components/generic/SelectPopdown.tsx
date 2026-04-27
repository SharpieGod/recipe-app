import Button from "./Button";
import Popdown from "./Popdown";

export type SelectEntry = { label: string; key: string };
type Props = {
  entries: SelectEntry[];
  onSelected: (key: string) => void;
  selectedEntryKey?: string;
  emptySelectText?: string;
  className?: string;
};

const SelectPopdown = ({
  entries,
  onSelected,
  selectedEntryKey,
  emptySelectText,
}: Props) => {
  return (
    <div className="w-full">
      <Popdown
        trigger={
          <Button className="w-full min-w-full text-nowrap" variant="empty">
            {selectedEntryKey
              ? (entries.find((e) => e.key == selectedEntryKey)?.label ?? (emptySelectText ?? "Select an item"))
              : (emptySelectText ?? "Select an item")}
          </Button>
        }
        className="max-h-40 overflow-y-auto"
      >
        {entries.map((e) => (
          <button key={e.key} onClick={() => onSelected(e.key)}>
            {e.label}
          </button>
        ))}
      </Popdown>
    </div>
  );
};

export default SelectPopdown;
