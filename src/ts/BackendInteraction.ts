import * as THREE from 'three';
import { GLTFLoader } from 'gltfLoader';
import ReplayLogic from './ReplayLogic.js';
import Other from './Other.js';
import { Config } from './config.js';

module Backend {

    export function GetSkyboxTexture(
        path: string,
        loader: THREE.CubeTextureLoader
        ): THREE.CubeTexture {
        return loader
            .setPath(path)
            .load(["lf", "rt", "up", "dn", "ft", "bk"]
        );
    }

    export function GetGLTFModel(
        path: string,
        loader: GLTFLoader,
        scene: THREE.Scene,
        fn: Function
        ): void {
        return loader.load(path, 
            (gltf) => fn(gltf, scene), 
            undefined, 
            (error) => console.error(error)
        );
    }

    export function GetReplayFile_Amount(
        path: string
        ): Promise<number> {
        return new Promise((resolve, reject) => {
            fetch(path)
            .then(response => response.text())
            .then(data => {
                if (Config.Debug) console.log("Loaded Replay JSON file amount: " + path)
                resolve(Number.parseInt(data));
            })
            .catch(error => {
                console.log(error);
                resolve(0);
            });
        });
    }

    export function GetReplayFile(
        path: string
        ): Promise<string> {
        return new Promise((resolve, reject) => {
            fetch(path)
            .then(response => response.text())
            .then(data => {
                if (Config.Debug) console.log("Loaded Replay JSON file: " + path)
                resolve(data);
            })
            .catch(error => {
                console.log(error);
                resolve("{}");
            });
        });
    }

    export async function GetData(
        path: string
        ): Promise<any> {
            var response = await fetch(path);
            var data = await response.json();
            if (Config.Debug) console.log("Loaded JSON file: " + path)
            return data;
    }

}

export default Backend;