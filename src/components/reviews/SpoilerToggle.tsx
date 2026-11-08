import { Checkbox, Text } from "@chakra-ui/react";

interface SpoilerToggleProps {
  isChecked: boolean;
  onChange: (value: boolean) => void;
  /** Sem texto não há o que esconder. */
  isDisabled?: boolean;
}

/** Opção "Contém spoiler" dos formulários de avaliação. */
export function SpoilerToggle({ isChecked, onChange, isDisabled }: SpoilerToggleProps) {
  return (
    <Checkbox
      mt={3}
      isChecked={isChecked && !isDisabled}
      isDisabled={isDisabled}
      onChange={(e) => onChange(e.target.checked)}
      colorScheme="primary"
      alignItems="flex-start"
    >
      <Text as="span" fontSize="sm" fontWeight={500} color="ink.100">
        Contém spoiler
      </Text>
      <Text fontSize="xs" color="ink.400">
        O texto fica escondido até a pessoa escolher ver. A nota continua visível.
      </Text>
    </Checkbox>
  );
}
