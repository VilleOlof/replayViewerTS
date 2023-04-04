import { Config } from './config.js';
import Other from './Other.js';
import Backend from './BackendInteraction.js';
import * as THREE from 'three';
import { OrbitControls } from 'orbitControls';
import { GLTFLoader } from 'gltfLoader'

class ThreeHandler {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;

    private Timer: any = null;

    //these might not be needed since we create a new scene upon resetting, WHICH menas we load in the smae objects again, which maybe isnt a good idea
    // private DisposeArray: any = [];

    // private OldObjects: { [id: string] : any[] } = {
    //     ["Lines"]: [],
    //     ["Spheres"]: [],
    //     ["Skybox"]: [],
    //     ["Level"]: [],
    // }

    //Key value is suppose to be THREE.Loader but 'load' doesnt exist on that type
    private Loaders: { [id: string] : any; } = {
        ["GLTF"]: new GLTFLoader(),
        ["CubeTexture"]: new THREE.CubeTextureLoader(),
        ["Texture"]: new THREE.TextureLoader(),
    }

    private StandardSphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.3, 16, 8);
    private PlaybackSpeedBase: number = 3;

    constructor(canvasID: string = "canvas") {
        if (Config.Debug) console.log("ThreeHandler Constructor");
        var canvas: HTMLElement = document.getElementById(canvasID);
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        //default camera rotation and position, just looks good
        this.camera.position.set(12.72, 8.69, -15.37);
        this.camera.rotation.set(3.09, 1.30, -3.09);

        this.AddControls();

        this.AddItemsToScene(this.scene);

        this.renderer.outputEncoding = THREE.sRGBEncoding;

        window.addEventListener('resize', () => this.onWindowResize(this.camera), false);

        //begin animation
        this.animate();
    }

    // animate function
    // This function is called by the constructor
    // It is a recursive function that calls itself every frame
    public animate(): void {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // This function is called when the window is resized.
    // It updates the camera's aspect ratio and projection matrix to match the new window size.
    // It also sets the renderer's size to match the new window size.
    private onWindowResize(camera: THREE.PerspectiveCamera): void {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // This function creates the controls for the user to interact with the 3D model
    private AddControls(): void {
        if (Config.Debug) console.log("Adding Controls")

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
        this.controls.enableDamping = true;
        this.controls.zoomSpeed = 3;
        this.controls.target = new THREE.Vector3(-49.85,-1.41,2.99);
    }

    //Adds default items to the scene
    private AddItemsToScene(scene: THREE.Scene): void {
        if (Config.Debug) console.log("Adding Scene Items");

        this.scene.add(new THREE.HemisphereLight( 0xffffff, 0x080820, 1 ));
    }

    //Resets the scene to its default state
    public ResetScene(): void {
        if (Config.Debug) console.log("Resetting Scene");

        this.scene = new THREE.Scene();
        this.AddItemsToScene(this.scene);
    }

    //Fixes the encoding for the materials/objects that can be affected by it
    private FixEncoding(object: any): void {
        object.format = THREE.RGBAFormat;
        object.encoding = THREE.sRGBEncoding;
    }

    public ChangeMaxCameraDistance(distance: number): void {
        this.controls.maxDistance = distance;
    }

    public UpdateControlsPosition(position: THREE.Vector3): void {
        this.controls.target = position;
    }

    //Loads the specified skybox into the scene
    public LoadSkybox(skybox: string): void {
        if (Config.Debug) console.log(`Loading Skybox: ${skybox}`);

        const path: string = Other.FormatString(Config.server + Config.skyboxPath, skybox);

        const skybox_texture: THREE.CubeTexture = Backend.GetSkyboxTexture(path, this.Loaders.CubeTexture);

        skybox_texture.encoding = THREE.sRGBEncoding;
        skybox_texture.format = THREE.RGBAFormat;

        this.scene.background = skybox_texture;
    }
    
    //Loads the specified level into the scene
    public LoadLevel(genericPlatform: Other.genericPlatform, level: string): void {
        if (Config.Debug) console.log(`Loading Level: ${level} on ${genericPlatform}`);

        const path: string = Other.FormatString(Config.server + Config.levelPath, genericPlatform, level);

        //Callback function for when the level is loaded
        function GLTFCallback(gltf: any, scene: THREE.Scene): void {
            FixTransparency(gltf);
            () => this.FixEncoding(gltf);
    
            scene.add(gltf.scene);
        }
    
        //Fixes transparency for materials who need it
        function FixTransparency(gltf: any): void {
            gltf.scene.traverse(function(child: any) {
                if (child instanceof THREE.Mesh) {
    
                    //Makes the materials one sided, no need to render the "inside"
                    child.material.side = THREE.BackSide;
    
                    //Gets the clean material name
                    const material: string = child.material.name.substring(0, child.material.name.indexOf('.'));
    
                    if (Config.transparentMaterials.includes(material)) {
                        child.material.transparent = true;
                    }
                }
            });
        }

        Backend.GetGLTFModel(path, this.Loaders.GLTF,this.scene, GLTFCallback);
    }
    
    public ReplayPrepareColor(i: number, limit: number, start: THREE.Color, end: THREE.Color): THREE.Color {
        var color: THREE.Color = start.clone();
        return color.lerp(end, i / limit);
    }

    public ReplayPrepareLine(lineColor: THREE.Color, ReplayStateData: any): any {
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({color: lineColor});
        this.FixEncoding(material);

        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, material);

        line.frustumCulled = false;
        this.scene.add(line);

        ReplayStateData.saved_geometry.push(geometry);
        return ReplayStateData;
    }

    public ReplayPrepareSphere(texture: THREE.Texture, ReplayStateData: any): any {
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(this.StandardSphereGeometry, material);

        sphere.material.transparent = true;
        sphere.frustumCulled = false;
        this.scene.add(sphere);

        ReplayStateData.spheres.push(sphere)
        return ReplayStateData;
    }

    public GetMarbleTexture(path: string, video: boolean): THREE.Texture {
        var texture: THREE.Texture | THREE.VideoTexture;
        if (video) {
            const video: HTMLVideoElement = document.createElement('video') as HTMLVideoElement;
            video.setAttribute('src', path);
            video.setAttribute('autoplay', 'true');
            video.setAttribute('loop', 'true');
            video.setAttribute('preload', 'true');

            video.oncanplay = () => video.muted = true;

            texture = new THREE.VideoTexture(video);
        }
        else {
            texture = this.Loaders.Texture.load(path);
        }

        this.FixEncoding(texture);

        //flips the texture right side up
        texture.center = new THREE.Vector2(0.5, 0.5);
        texture.rotation = 180 * 0.0174532925; // 180 * radian

        return texture;
    }

}

export default ThreeHandler;