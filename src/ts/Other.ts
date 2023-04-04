import { Config } from './config.js';
import Backend from './BackendInteraction.js';

module Other {

    export type genericPlatform = "classic" | "custom";
    export enum Platform {
        Global = "Global",
        Switch = "Switch",
        Steam = "Steam",
        Custom = "Custom"
    }

    export class MIU_Data {
        public static Level_To_ID: any = undefined;
        public static Levels: any = undefined;
        public static CustomLevels: any = undefined;
        public static Skyboxes: any = undefined;

        public static dataNames: string[] = ["classicLevels", "classicLevelOrder", "customLevels", "levelSkyboxes"];
    }

    export function LevelToID(level: string): string {
        return MIU_Data.Level_To_ID[level];
    }

    export function LevelToSkyboxID(level: string): string {
        return MIU_Data.Skyboxes[level];
    }

    export async function GetMIUData(): Promise<void> {
        for (let index: number = 0; index < MIU_Data.dataNames.length; index++) {
            var name: string = MIU_Data.dataNames[index];
            var path: string = FormatString(Config.server + Config.dataOtherPath, name, "json");

            var data: any = await Backend.GetData(path);
            if (data == undefined) return;

            switch (name) {
                case "classicLevels": { MIU_Data.Level_To_ID = data; break; }
                case "classicLevelOrder": { MIU_Data.Levels = data; break; }
                case "customLevels": { MIU_Data.CustomLevels = data; break; }
                case "levelSkyboxes": { MIU_Data.Skyboxes = data; break; }
            }
        }

        //if (Config.Debug) console.log(MIU_Data.Level_To_ID, MIU_Data.Levels, MIU_Data.CustomLevels, MIU_Data.Skyboxes);
    }

    export function FormatString(str: string, ...val: string[]) {
        for (let index: number = 0; index < val.length; index++) {
          str = str.replace(`{${index}}`, val[index]);
        }
        return str;
    }

    export function FormatTime(seconds: number) {
        var minus: boolean = seconds < 0;
        if (minus) seconds = -seconds;

        var a: string = new Date(seconds * 1000).toISOString().substring(14, 19)
        var milli: string = (seconds - Math.floor(seconds)).toFixed(3)

        return `${minus ? "-" : ""}${a}${milli.substring(1)}`;
    }
}

export default Other;