//Acts like the global config and default values
var Config: any = {
    Debug: true
};

// GetConfig() fetches the configuration information.
// This information is saved in the global variable Config.
async function GetConfig(): Promise<void> {
    Config = await fetch("/config.json").then((response) => {
        return response.json();
    });
}

//Initializing the config at startup
GetConfig();

export { Config, GetConfig };