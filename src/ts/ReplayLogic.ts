import * as THREE from 'three';
import { Config } from './config.js';
import Other from './Other.js';
import Backend from './BackendInteraction.js';
import { threeHandler, marbleFollow } from './main.js';
import documentInteraction from './documentInteraction.js';

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';

module ReplayLogic {

    function Default_ReplayStateData(): any {
        if (Config.Debug) console.log("Default_ReplayStateData");

        return {
            positions: Array<THREE.Vector3>(),
            omegas: Array<THREE.Vector3>(),
            time_indexes: Array<number>(),
            saved_lines: Array<THREE.BufferGeometry>(),
            saved_spheres: Array<THREE.BufferGeometry>(),
            current_time : 0,
            time_array: Array<number>(),
            delta_time: 0,
            max_time: 0,
            has_init: false,
        }
    }
    var ReplayStateData: { [key: string]: any } = Default_ReplayStateData();

    export class ReplayData {
        public Position: THREE.Vector3[];
        public Omega: THREE.Vector3[];
        public TimeIndex: number[];

        constructor() {
            this.Position = [];
            this.Omega = [];
            this.TimeIndex = [];
        }

        public AddPosition(position: THREE.Vector3 | Array<THREE.Vector3>): void {
            if (Array.isArray(position)) {
                this.Position = this.Position.concat(position);
                return;
            }
            this.Position.push(position);
        }

        public AddOmega(omega: THREE.Vector3): void {
            this.Omega.push(omega);
        }

        public AddTimeIndex(timeIndex: number): void {
            this.TimeIndex.push(timeIndex);
        }
    }

    export class ReplayState {
        public position: THREE.Vector3;
        public velocity: THREE.Vector3;
        public omega: THREE.Vector3;
        public timeIndex: number;
    }

    export class ReplayScore {
        public rank: number;
        public username: string;
        public time: number;
        public platform: string;
        public level: string;
        public timestamp: string;
        public skin: string;
    }

    //This is what comes from the JSON file
    export class Replay {
        public replays: {[key: number]: ReplayState[]};
        public scores: ReplayScore[];
    }

    export class MarbleFollow {
        public enabled: boolean;
        public index: number;
        public camera_distance : number;

        constructor() {
            this.enabled = true;
            this.index = 0;
            this.camera_distance = 50;
        }

        public Update(Point: THREE.Vector3, marbleIndex: number): void {
            if (this.enabled && this.index == marbleIndex) {
                threeHandler.UpdateControlsPosition(Point.clone());
            }
        }
    }

    function ParseReplayJSON(replays: any): {[key: number]: ReplayState[]} {
        var replay: {[key: number]: ReplayState[]} = {};

        for (var j = 0; j < replays.length; j++) {
            var states: any = replays[j].States;
            
            for (var i = 0; i < states.length; i++) {
                var currentState: any = states[i];

                var position: THREE.Vector3 = new THREE.Vector3(currentState.position[0], currentState.position[1], currentState.position[2]);
                var velocity: THREE.Vector3 = new THREE.Vector3(currentState.velocity[0], currentState.velocity[1], currentState.velocity[2]);
                var omega: THREE.Vector3 = new THREE.Vector3(currentState.omega[0], currentState.omega[1], currentState.omega[2]);
                var timeIndex: number = currentState.timeIndex;

                var replayState: ReplayState = new ReplayState();
                replayState.position = position;
                replayState.velocity = velocity;
                replayState.omega = omega;
                replayState.timeIndex = timeIndex;

                if (replay[j] == undefined) replay[j] = [];
                replay[j].push(replayState);
            }
        }

        return replay;
    }

    export async function GetReplayFile(
        genericPlatform: Other.genericPlatform, 
        level: string, platform: 
        Other.Platform, 
        fileIndex: number
        ): Promise<Replay> {
            const path: string = Other.FormatString(Config.server + Config.replayPath,genericPlatform, level, platform, fileIndex.toString());

            var JSON_Content: string = await Backend.GetReplayFile(path);

            var replay1 = JSON.parse(JSON_Content);
            replay1.replays = ParseReplayJSON(JSON.parse(replay1.replays))
            replay1.scores = plainToInstance(ReplayScore, JSON.parse(replay1.scores));

            return replay1;
    }

    export function GetReplayData(replays: Replay[], limit: number): ReplayData {
        const replayData: ReplayData = new ReplayData();

        for (let i = 0; i < limit; i++) {
            if (replays[i]?.replays == undefined) continue;

            // var replay_state: ReplayState[] = replays[i]
            // .replays.sort((
            //     a: { timeIndex: number; }, b: { timeIndex: number; }) => 
            //     a.timeIndex - b.timeIndex);

            // //Position
            // // replayData.AddPosition(replay_state.map((e: { position: number[]; }, i: any) => new THREE.Vector3(e.position[0], e.position [1], e.position[2] * -1)));
            
            // var positions: ReplayState[] = replay_state.map((state: ReplayState, i: number) => {
            //     return state;
            // });
            // console.log(positions);

            // console.log(replay_state);
            // var b = [];
            // for (let i = 0; i < replay_state.length; i++) {
            //     for (let j = 0; j < replay_state.length; j++) {
            //         b.push(replay_state[i].position[j]);
            //     }
            // }
            // replayData.AddPosition(b);

            // var position: THREE.Vector3 = replay_state[i].position;
            // console.log(position);
            // position.z = position.z * -1;
            // replayData.AddPosition(position);

            //Omega
            // replayData.AddOmega(replay_state.map((
            //     e: { omega: number[]; }, i: any) => 
            //     new THREE.Vector3(-e.omega[0], e.omega[1], e.omega[2])));

            // var omega: THREE.Vector3 = replay_state[i].omega;
            // omega.x = omega.x * -1;
            // replayData.AddOmega(omega);

            //TimeIndex
            //if (replay_state[0].timeIndex != undefined) replayData.AddTimeIndex(replay_state.map((e, i) => e.timeIndex));
            //else Inputs.amount = Inputs.amount-1;
            // if (replay_state[0].timeIndex != undefined) replayData.AddTimeIndex(replay_state[i].timeIndex);
        }

        return replayData;
    }

    async function GetServerSideMax(genericPlatform: Other.genericPlatform, level: string): Promise<number> {
        const path: string = Other.FormatString(Config.server + Config.replayAmountPath, genericPlatform, level);

        var serverMax: number = await Backend.GetReplayFile_Amount(path);

        return serverMax;
    }

    function Get50s(inputs: documentInteraction.UserInputs, serverMax: number): number {
        var total50s: number = 1;

        for (var i = 1; i <= inputs.limit; i++) {
            if (i % Config.AmountPerFile == 0) {
                total50s++;
                if (total50s > serverMax) return serverMax;
            }
        }

        return total50s;
    }

    export async function StartReplayButton(): Promise<void> {
        ReplayStateData = Default_ReplayStateData();

        threeHandler.ResetScene();

        var inputs: documentInteraction.UserInputs = documentInteraction.GetUserInputs();

        var serverMax: number = await GetServerSideMax(inputs.genericPlatform, inputs.level_id);
        var total50s: number = Get50s(inputs, serverMax);

        inputs.limit = (inputs.limit > serverMax*Config.AmountPerFile ? serverMax*Config.AmountPerFile : inputs.limit)

        threeHandler.UpdateControlsPosition(new THREE.Vector3(0, 0, 0));

        var AllReplays: {[key: number]: ReplayState[]} = undefined;
        var AllScores: ReplayScore[] = undefined;

        for (var i = 0; i < total50s; i++) {

            var replayFile: Replay = await ReplayLogic.GetReplayFile(inputs.genericPlatform, inputs.level_id, inputs.platform, i);

            //AllScores = AllScores.concat(replayFile.scores);

            // if (AllReplays == undefined) AllReplays = replayFile.replays;
            // else {
            //     for (var j = 0; j < Object.keys(AllReplays).length; j++) {
            //         AllReplays[j] = AllReplays[j].concat(replayFile.replays[j]);
            //     }
            // }
        }

        //AllScores.slice(inputs.skip, AllScores.length);
        //AllReplays.slice(inputs.skip, AllReplays.length);
        
        threeHandler.LoadSkybox(Other.LevelToSkyboxID(inputs.level_id));

        threeHandler.LoadLevel(inputs.genericPlatform, inputs.level);


    }

}

export default ReplayLogic;