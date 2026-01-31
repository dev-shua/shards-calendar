<script>
  import { calendarUi } from "@ui/calendarUiStore";

  let name = "";

  $: if ($calendarUi?.definition) {
    name = $calendarUi
  }
</script>