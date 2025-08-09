import { faStore, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  name?: string; // radio group, за замовч. "category"
  value: string; // значення категорії
  label: string; // текст
  icon: IconDefinition; // FA іконка
  checked?: boolean; // контрольований стан (опц.)
  defaultChecked?: boolean; // для "all" на старті
  onChange?: (value: string) => void;
};

export default function CategoryOption({
  name = "category",
  value,
  label,
  icon,
  checked,
  defaultChecked,
  onChange,
}: Props) {
  return (
    <label className="category">
      <input
        type="radio"
        name={name}
        value={value}
        className="sr-only"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={() => onChange?.(value)}
      />
      <FontAwesomeIcon
        size="xl"
        icon={icon}
        className="p-2 rounded-full text-gray-500"
      />
      {label}
    </label>
  );
}
