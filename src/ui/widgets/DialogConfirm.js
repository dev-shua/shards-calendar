export const dialogConfirm = async ({
  title = "Unsaved changes",
  content,
  yes = {
    label: "Discard",
    icon: "fa-solid fa-trash"
  },
  no = {
    label: "Cancel",
    icon: "fa-solid fa-xmark"
  },
  defaultYes = false
}) => {
  const DialogV2 = foundry.applications.api.DialogV2;
  return DialogV2.confirm({
    window: { title },
    content,
    yes: {
      label: yes.label,
      icon: yes.icon,
    },
    no: {
      label: no.label,
      icon: no.icon,
    },
    defaultYes
  })
}