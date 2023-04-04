import { Config } from './config.js';
import ThreeHandler from './ThreeHandler.js';
import ReplayLogic from './ReplayLogic.js';
import Other from './Other.js';
import documentInteraction from './documentInteraction.js';

export namespace ReplayViewer {
    if (Config.Debug) console.log("Debugging Enabled");
    if (Config.WriteDebugObjectAtStartup) console.log(Config);
    
    (async () => {
        await Other.GetMIUData();

        Main();
    })();


}

function Main(): void {
    threeHandler = new ThreeHandler();
    marbleFollow = new ReplayLogic.MarbleFollow();

    threeHandler.LoadSkybox("blue03");
    threeHandler.LoadLevel("classic", "Stay Frosty");

    threeHandler.ResetScene();

    threeHandler.LoadSkybox("sky001");
    threeHandler.LoadLevel("classic", "Learning to Roll");


    // ReplayLogic.GetReplayFile("classic", "SP_rollTutorial", Other.Platform.Global, 0).then(
    //     (replay) => {
    //         ReplayLogic.GetReplayData([replay], 1);
    //         console.log(replay);
    //     }
    // ), (error) => {
    //     console.log(error);
    // };

    ReplayLogic.StartReplayButton();
}

export var threeHandler: ThreeHandler = undefined;
export var marbleFollow: ReplayLogic.MarbleFollow = undefined;