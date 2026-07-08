import { useI18n } from "@/lib/i18n/hooks";
import { Button } from "@mantine/core";
import Modal from "@/components/ui/modal";
import ErrorAlert from "@/components/ui/error-alert";

export default function DeleteModal({
  opened,
  onClose,
  title,
  subTitle,
  action,
  loading,
  error,
  disabled = false,
  children = null,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  subTitle: string;
  action: () => void;
  loading: boolean;
  error: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const { translation } = useI18n();


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    action();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p>{subTitle}</p>

        {children}

        <div className="flex gap-2">
          <Button variant="light" color="dark" radius="md" onClick={onClose} fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" color="red" loading={loading} disabled={disabled} radius="md" fullWidth>
            {translation.confirm}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
