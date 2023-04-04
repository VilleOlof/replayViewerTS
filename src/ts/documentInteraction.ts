import Other from "./Other.js";
import { Config } from "./config.js";
import ReplayLogic from "./ReplayLogic.js";
import { ReplayViewer } from "./main.js";

module documentInteraction {

    export class UserInputs {
        public platform: Other.Platform;
        public level: string;
        public level_id: string;
        public genericPlatform: Other.genericPlatform;
        public limit: number;
        public skip: number;
        public amount: number;

        constructor() {
            this.platform = Other.Platform.Global;
            this.level = "";
            this.genericPlatform = "classic";
            this.limit = 0;
            this.skip = 0;
            this.amount = 0;
        }
    }
    var inputIDs: string[] = ["platform", "level", "skip", "limit"]; //HTMLElement IDs of the inputs

    export function RegisterEventListeners(): void {
        throw new Error("Method not implemented.");
    }

    export function GetUserInputs(): UserInputs {

        var inputs: UserInputs = new UserInputs();

        inputIDs.forEach((id) => {
            var element = document.getElementById(id) as HTMLInputElement;

            //i dont know if this helps but its there
            var index = inputs[id];
            type specified_type = typeof index;

            inputs[id] = element.value as specified_type;
        });

        inputs.amount = inputs.limit - inputs.skip;

        inputs.genericPlatform = inputs.platform == Other.Platform.Global ? "classic" : "custom";

        inputs.level_id = Other.LevelToID(inputs.level);

        if (inputs.amount > Config.LimitPerServerRequest) inputs.amount = Config.LimitPerServerRequest;

        if (Config.Debug) console.log(inputs);

        return inputs;
    }

    export function UpdateLeaderboard(scores: ReplayLogic.ReplayScore[], marbleFollow: ReplayLogic.MarbleFollow): void {

        var leaderboard: HTMLTableElement = document.getElementById("leaderboard") as HTMLTableElement;

        while (leaderboard.firstChild) {
            leaderboard.removeChild(leaderboard.firstChild);
        }

        var tr: HTMLTableRowElement = leaderboard.insertRow();

        var td_rank: HTMLTableCellElement = tr.insertCell();
        var td_username: HTMLTableCellElement = tr.insertCell();
        var td_time: HTMLTableCellElement = tr.insertCell();

        td_rank.innerText = "Rank";
        td_username.innerText = "Username";
        td_time.innerText = "Time";

        leaderboard.appendChild(tr);

        scores.forEach((score) => {

            var tr: HTMLTableRowElement = leaderboard.insertRow();

            var td_rank: HTMLTableCellElement = tr.insertCell();
            var td_username: HTMLTableCellElement = tr.insertCell();
            var td_time: HTMLTableCellElement = tr.insertCell();

            var button: HTMLButtonElement = document.createElement("button") as HTMLButtonElement;
            button.className = "leaderboardButton";

            var formatedTime: string = Other.FormatTime(score.time);

            td_rank.innerText = score.rank.toString();
            button.innerText = score.username;
            td_time.innerText = formatedTime;


            AddScoreHoverInteraction(score, button);
            AddFollowButtonInteraction(score, button, marbleFollow);

            td_username.appendChild(button)
            leaderboard.appendChild(tr);
        });
    }

    function AddScoreHoverInteraction(score: ReplayLogic.ReplayScore, button: HTMLButtonElement): void {
        let hoverData: HTMLDivElement = document.createElement("div");

        var formattedTimestamp_exludingTime: string = new Date(score.timestamp).toLocaleDateString("sv-SE", {year: 'numeric', month: 'numeric', day: 'numeric'});
        hoverData.innerHTML = `Platform: ${score.platform}<br>Skin: ${score.skin}<br>Date: ${formattedTimestamp_exludingTime}`
        hoverData.className = "hoverData";

        let hoverData_timeOut = undefined;
        button.onmouseover = function() {
            hoverData.style.opacity = "0";
            hoverData_timeOut = setTimeout(() => {
                hoverData.style.opacity = "1";
            }, 0.5*1000);
        }

        button.onmouseout = function() {
            hoverData.style.opacity = "0";
            if (hoverData_timeOut != undefined) {
                clearTimeout(hoverData_timeOut);
                hoverData_timeOut = undefined;
            }
        }

        button.appendChild(hoverData);
    }

    function AddFollowButtonInteraction(score: ReplayLogic.ReplayScore, button: HTMLButtonElement, marbleFollow: ReplayLogic.MarbleFollow): void {
        ((currentScore) => {
            button.onclick = () => {
                if (Config.Debug) console.log("Following: " + currentScore.username);
                marbleFollow.index = currentScore.rank - 1;

                if (this.ReplayStateData?.spheres[marbleFollow.index]?.position == undefined) {
                    if (Config.Debug) console.log("Error: Marble position is undefined at following marble LB button");
                    marbleFollow.index = 0;
                    return;
                }
                var point: THREE.Vector3 = this.ReplayStateData.spheres[marbleFollow.index].position;

                marbleFollow.Update(point, marbleFollow.index);
            }
        })(score);
    }

    export function UpdateUserInputs(inputs: UserInputs): void {
        inputIDs.forEach((id) => {
            var element = document.getElementById(id) as HTMLInputElement;
            element.value = inputs[id];
        });
    }
}

export default documentInteraction;