import { MODULE_NAME } from "@core/constants";
import { getSetting, setSetting, SETTINGS_KEYS } from "./settings";

export async function showWelcome() {
  if (!game.user.isGM) return;
  
  const MESSAGE = `Welcome Message`;

  if(!getSetting(SETTINGS_KEYS.WELCOME_SHOWN)) {
    ChatMessage.create({
      user: game.user.id,
      whisper: game.users.filter(user => user.isGM).map(user => user.id),
      blind: true,
      speaker: { alias: MODULE_NAME },
      content: MESSAGE,
    });

    // TODO: Uncomment this once clear
    // await setSetting(SETTINGS_KEYS.WELCOME_SHOWN, true);
  }
}