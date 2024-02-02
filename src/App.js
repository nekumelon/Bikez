import Footer from './Components/containers/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TWEEN from '@tweenjs/tween.js';
import {
	faInfoCircle,
	faTimes,
	faHammer,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import Button from 'Components/shared/Button';
import './App.scss';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Component, createRef } from 'react';
import HorizontalSelector from 'Components/shared/HorizontalSelector';

const baseColor = new THREE.Color(0x222222);
const selectedColor = new THREE.Color(0xff0000);

const modelPath = 'models/B.glb';

const cubeTextureLoader = new THREE.CubeTextureLoader();

const envMaps = (function () {
	const path = 'assets/images/envMap/';
	const format = '.jpg';
	const urls = [
		path + 'px' + format,
		path + 'nx' + format,
		path + 'py' + format,
		path + 'ny' + format,
		path + 'pz' + format,
		path + 'nz' + format,
	];

	const reflectionCube = cubeTextureLoader.load(urls);

	const refractionCube = cubeTextureLoader.load(urls);
	refractionCube.mapping = THREE.CubeRefractionMapping;

	return {
		none: null,
		reflection: reflectionCube,
		refraction: refractionCube,
	};
})();

const parts = [
	{
		name: 'Frame',
		objectName: 'frame',
		description:
			'The frame is the main part of the bike. It is the part that holds all the other parts together.',
	},
	{
		name: 'Handlebar',
		objectName: 'bar',
		offsetZ: 0.15,
		description:
			'The handlebar is the part of the bike that you hold onto when you are riding it.',
	},
	{
		name: 'Chain',
		objectName: 'chain',
		color: new THREE.Color(0xaaaaaa),
		description:
			'The chain is a spinning part of the bike that connects the pedals to the rear wheel.',
	},
	{
		name: 'Grips',
		objectName: 'grips',
		objectFind: 'Grip',
		offsetY: 0.1,
		description: 'The grips are where you hold onto the handlebar.',
	},
	{
		name: 'Levers',
		objectName: 'levers1',
		objectFind: 'lever',
		offsetY: 0.1,
		description:
			'The levers are the parts of the bike that you use to change gears, and to brake.',
	},
	{
		name: 'Saddle',
		objectName: 'saddle',
		objectFind: 'saddle',
		offsetY: 0.1,
		description: 'The saddle is the cushion of the bike that you sit on.',
	},
	{
		name: 'Spokes',
		objectName: 'rearSpokes',
		objectFind: 'Spoke',
		color: new THREE.Color(0xaaaaaa),
		offsetZ: -0.15,
		description:
			'The spokes are the parts of the wheel that connect the wheel hub to the rim.',
	},
	{
		name: 'Seatpost',
		objectName: 'seatpost',
		offsetZ: -0.05,
		description:
			'The seatpost is the part of the bike that holds the saddle in place.',
	},
	{
		name: 'Front Fork',
		objectName: 'frontFork',
		description:
			'The front fork is where the front wheel is attached to the frame.',
	},
	{
		name: 'Rear Shock',
		objectName: 'rearShock',
		offsetZ: 0.075,
		offsetY: 0.05,
		description:
			'The rear shock is the part of the bike that absorbs the bumps in the road.',
	},
	{
		name: 'Rear Suspension',
		objectName: 'rearSuspension',
		offsetZ: -0.05,
		offsetX: -0.1,
		offsetY: 0.1,
		description:
			'The rear suspension is where the rear shock is attached to the frame.',
	},
	{
		name: 'Derailleur',
		objectName: 'derailleur',
		offsetX: -0.05,
		description:
			'The derailleur is the part of the bike that changes gears.',
	},
	{
		name: 'Chain Ring',
		objectName: 'chainRing',
		offsetX: -0.05,
		offsetZ: -0.075,
		color: new THREE.Color(0xaaaaaa),
		description:
			'The chain ring is the part of the bike that the chain is attached to.',
	},
	{
		name: 'Cassette',
		objectName: 'cassette',
		color: new THREE.Color(0xaaaaaa),
		description:
			'The cassette is where the chain is attached to the rear wheel.',
	},
	{
		name: 'Pedals',
		objectName: 'pedals',
		offsetX: -0.22,
		offsetZ: 0.12,
		description:
			'The pedals are the parts of the bike that you use to make the bike move.',
	},
	{
		name: 'Tires',
		objectName: 'frontTire',
		objectFind: 'Tire',
		offsetY: 0.4,
		offsetZ: 0.1,
		color: new THREE.Color(0x080808080808),
		matte: true,
		description:
			'The tires are the parts of the bike that hold the bike up off the ground.',
	},
	{
		name: 'Wheels',
		objectFind: 'Wheel',
		objectName: 'rearWheel',
		offsetX: 0.1,
		offsetY: 0.3,
		offsetZ: 0.1,
		color: new THREE.Color(0x444444),
		description:
			'The wheels are the parts of the bike that the tires are attached to, and keep the tire in place.',
	},
	{
		name: 'Brake Disks',
		objectFind: 'BrakeDisk',
		objectName: 'frontBrakeDisk',
		offsetZ: 0.075,
		color: new THREE.Color(0xaaaaaa),
		description:
			'The brake disks are the parts of the bike that you use to stop the bike.',
	},
];

const getCenterPoint = (mesh) => {
	const geometry = mesh.geometry;
	geometry.computeBoundingBox();

	const center = new THREE.Vector3();
	geometry.boundingBox.getCenter(center);
	mesh.localToWorld(center);

	return center;
};

const centerPointToScreen = (center, camera) => {
	const vector = new THREE.Vector3();

	const halfWidth = 0.5 * window.innerWidth;
	const halfHeight = 0.5 * window.innerHeight;

	vector.copy(center);
	vector.project(camera);

	vector.x = vector.x * halfWidth + halfWidth;
	vector.y = -(vector.y * halfHeight) + halfHeight;

	return {
		x: vector.x,
		y: vector.y,
	};
};

class App extends Component {
	constructor() {
		super();

		this.three = {};
		this.state = {
			helpScreenOpen: false,
		};
		this.bodyContentRef = createRef();
	}

	selectPart(part) {
		let { scene } = this.three;

		scene.traverse((node) => {
			let checkNodes = [node];

			if (node.type === 'Group') {
				for (const child of node.children) {
					if (!child.material) continue;

					checkNodes.push(child);
				}
			}

			for (const child of checkNodes) {
				if (!child.material) continue;

				if (!part) {
					for (const part of parts) {
						part.partLabel.style.display = 'block';

						const objectFind = part.objectFind?.toLowerCase();
						const parentName = child.parent.name;

						if (
							child.name === part.objectName ||
							(objectFind &&
								child.name
									.toLowerCase()
									.includes(objectFind)) ||
							parentName === part.objectName ||
							(objectFind &&
								parentName.toLowerCase().includes(objectFind))
						) {
							child.material.color = part.color || baseColor;
						}
					}

					return;
				}

				const nodeSelected =
					node.name === part.objectName ||
					(part.objectFind &&
						node.name
							.toLowerCase()
							.includes(part.objectFind.toLowerCase())) ||
					node.parent.name === part.objectName ||
					(part.objectFind &&
						node.parent.name
							.toLowerCase()
							.includes(part.objectFind.toLowerCase()));

				if (nodeSelected) {
					child.material.color = selectedColor;
				} else {
					let partColor = baseColor;

					for (const part of parts) {
						const objectFind = part.objectFind?.toLowerCase();
						const parentName = child.parent.name;

						if (
							child.name === part.objectName ||
							(objectFind &&
								child.name
									.toLowerCase()
									.includes(objectFind)) ||
							parentName === part.objectName ||
							(objectFind &&
								parentName.toLowerCase().includes(objectFind))
						) {
							partColor = part.color || baseColor;
						}
					}

					child.material.color = partColor;
				}
			}
		});
	}

	toggleHelpScreen() {
		this.setState(
			{
				helpScreenOpen: !this.state.helpScreenOpen,
				selectedPart: null,
			},
			this.selectPart.bind(this, null)
		);
	}

	createScenes() {
		console.log('Creating scenes...');
		// Create the main scene for the bike
		const scene = (this.three.scene = new THREE.Scene());

		// Create the scene for the floor and shadows/highlights
		let floorScene = (this.three.floorScene = new THREE.Scene());

		// Add fog to taper off the edges of the scene (Blend with background color)
		floorScene.fog = new THREE.Fog(0x000000, 2, 5);

		console.log('Finished creating scenes.');
	}

	createCamera() {
		console.log('Creating camera...');

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		const aspectRatio = windowWidth / windowHeight;

		const camera = (this.three.camera = new THREE.PerspectiveCamera(
			45,
			aspectRatio,
			0.1,
			1000
		));

		camera.position.set(1, 1.5, 0);

		console.log('Finished creating camera.');
	}

	createRenderer() {
		console.log('Creating renderer...');

		const renderer = (this.three.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		}));

		// Apply shadow settings
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.VSMShadowMap;
		renderer.shadowMapSoft = true;

		// Don't auto clear as we are rendering multiple scenes
		renderer.autoClear = false;
		renderer.setClearColor(0x000000, 0);

		// Add the renderer to the DOM
		this.bodyContentRef.current.appendChild(renderer.domElement);

		console.log('Finished creating renderer.');
	}

	resize() {
		let { renderer } = this.three;

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		const aspectRatio = windowWidth / windowHeight;
		let camera = this.three.camera;

		renderer.setSize(windowWidth, windowHeight);

		camera.aspect = aspectRatio;
		camera.updateProjectionMatrix();
	}

	createControls() {
		console.log('Creating controls...');

		let { camera, renderer } = this.three;
		const controls = (this.three.controls = new OrbitControls(
			camera,
			renderer.domElement
		));

		// Disable controls for the initial animation
		controls.enabled = false;

		controls.enableDamping = true;

		// Don't allow the user to rotate the camera below the ground or zoom out too far
		controls.maxPolarAngle = Math.PI / 2 - 0.1;
		controls.maxDistance = 2;

		controls.target = new THREE.Vector3(0, 0.5, -0.3);

		// Update the controls initially to set the camera position
		controls.update();

		console.log('Finished creating controls.');
	}

	addMouseEvents() {
		const domElement = this.three.renderer.domElement;

		domElement.addEventListener('mousedown', () => {
			domElement.style.cursor = 'grabbing';
		});

		domElement.addEventListener('mouseup', () => {
			domElement.style.cursor = 'grab';
		});
	}

	createLoaders() {
		const gltfLoader = (this.three.gltfLoader = new GLTFLoader());
		const textureLoader = (this.three.textureLoader =
			new THREE.TextureLoader());
	}

	loadFloor() {
		console.log('Loading floor...');

		let { textureLoader, floorScene } = this.three;
		let texture = textureLoader.load('assets/images/floor.jpg');

		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		texture.repeat.set(50, 50);

		const floor = (this.three.floor = new THREE.Mesh(
			new THREE.PlaneGeometry(100, 100),
			new THREE.MeshPhysicalMaterial({
				color: 0x333333,
				emissive: 0x000000,
				reflectivity: 0.9,
				roughness: 0.5,
				map: texture,
			})
		));

		floor.castShadow = false;
		floor.receiveShadow = true;

		// Place the floor just below the bike
		floor.position.y = -0.01;
		floor.rotation.x = -Math.PI / 2;

		floorScene.add(floor);

		console.log('Finished loading floor.');
	}

	loadModel() {
		console.log('Loading model...');

		let { scene, floorScene, camera, controls } = this.three;

		this.three.gltfLoader.load(modelPath, (gltf) => {
			const modelScene = gltf.scene;

			// Create a clone of the model scene to use for the floor scene
			const transparentModelScene = gltf.scene.clone();

			// Go through the transparent model and make the materials transparent
			transparentModelScene.traverse((node) => {
				if (!node.material) return;

				node.material = new THREE.MeshBasicMaterial({
					transparent: true,
					opacity: 0,
				});

				node.castShadow = true;
				node.receiveShadow = true;
			});

			modelScene.traverse((node) => {
				// Create a list of nodes to check for parts
				let checkNodes = [node];

				if (node.type === 'Group') {
					for (const child of node.children) {
						if (!child.material) return;

						checkNodes.push(child);
					}
				}

				for (const child of checkNodes) {
					if (!child.material) return;

					// Find any related parts for this node
					const part = parts.find((part) => {
						const objectName = part.objectName?.toLowerCase();
						const childName = child.name?.toLowerCase();
						const objectFind = part.objectFind?.toLowerCase();
						const parentName = child.parent.name?.toLowerCase();

						if (objectName === childName) return true;
						if (objectName === parentName) return true;
						if (objectFind) {
							if (childName.includes(objectFind)) return true;
							if (parentName.includes(objectFind)) return true;
						}
					});

					const partColor = part?.color ?? baseColor;

					if (part) {
						part.partLabel.style.display = 'block';
					}

					if (part?.matte) {
						child.material = new THREE.MeshPhysicalMaterial({
							color: partColor,
							metalness: 0,
							roughness: 0.7,
						});
					} else {
						child.material = new THREE.MeshLambertMaterial({
							color: partColor,
							emissive: 0xaaaaaa,
							reflectivity: 0.92,
							combine: THREE.MultiplyOperation,
							envMap: envMaps.reflection,
						});
					}
				}
			});

			scene.add(modelScene);
			floorScene.add(transparentModelScene);

			console.log('Finished loading model.');

			setTimeout(() => {
				new TWEEN.Tween(new THREE.Vector3(1, 1.5, 0))
					.to({ x: 1, y: 0.7, z: -1 }, 2000)
					.easing(TWEEN.Easing.Linear.None)
					.onUpdate((pos, time) => {
						camera.position.copy(pos);
						camera.lookAt(0, 0.5, -0.3);

						parts.forEach((part) => {
							part.partLabel.style.opacity = Math.min(time);
						});
					})
					.onComplete(() => {
						controls.enabled = true;
					})
					.start();
			}, 1000);
		});
	}

	createParts() {
		console.log('Creating parts...');

		for (const part of parts) {
			let partLabel = document.createElement('div');

			partLabel.innerText = part.name;
			partLabel.className = 'part-label';
			partLabel.style.display = 'none';

			partLabel.addEventListener('click', () => {
				let { selectedPart } = this.state;

				const isSelected = selectedPart === part;

				// If the user selects the same part, deselect it
				selectedPart = !isSelected && part;

				this.setState(
					{
						selectedPart,
						helpScreenOpen: !isSelected,
					},
					this.selectPart.bind(this, part)
				);
			});

			part.partLabel = partLabel;
			this.bodyContentRef.current.appendChild(partLabel);
		}

		console.log('Finished creating parts.');
	}

	createLights() {
		console.log('Creating lights...');

		let { scene, floorScene } = this.three;

		let lights = (this.three.lights = {});

		let leftLight = new THREE.DirectionalLight(0x555555, 6);

		leftLight.position.set(1, 1, 0);
		leftLight.target.position.set(0, 0, 0);

		scene.add(leftLight);
		lights.leftLight = leftLight;

		let rightLight = new THREE.DirectionalLight(0x555555, 6);

		rightLight.position.set(-1, 1, 0);
		rightLight.target.position.set(0, 0, 0);

		scene.add(rightLight);
		lights.rightLight = rightLight;

		let topLight = new THREE.DirectionalLight(0x222222, 6);

		topLight.position.set(0, 1, 0);
		topLight.target.position.set(0, 0, 0);

		scene.add(topLight);
		lights.topLight = topLight;

		let bottomLight = new THREE.DirectionalLight(0x222222, 6);

		bottomLight.position.set(0, -1, 0);
		bottomLight.target.position.set(0, 0, 0);

		scene.add(bottomLight);
		lights.bottomLight = bottomLight;

		// Light above the bike, only applies to the floor for shadows and highlights
		let spotLight = new THREE.PointLight(0x666666, 3);
		let shadow = spotLight.shadow;
		let shadowCamera = shadow.camera;

		spotLight.position.set(0, 3.5, 0);

		spotLight.castShadow = true;

		shadow.radius = 15;
		shadow.blurSamples = 25;

		// Have to bias to remove shadow acne
		shadow.normalBias = 0.02;

		shadow.mapSize.width = 2048;
		shadow.mapSize.height = 2048;

		shadowCamera.near = 0.5;
		shadowCamera.far = 10;

		shadowCamera.left = -10;
		shadowCamera.right = 10;
		shadowCamera.top = 10;
		shadowCamera.bottom = -10;

		// Add the light to the floor scene so it only applies to the floor
		floorScene.add(spotLight);
		lights.spotLight = spotLight;

		console.log('Finished creating lights.');
	}

	animate() {
		let { camera, floorScene, scene, controls, renderer } = this.three;
		requestAnimationFrame(this.animate.bind(this));

		// Only update the controls if the camera is not animating
		if (controls.enabled) {
			controls.update();
		}

		TWEEN.update();

		renderer.render(scene, camera);
		renderer.render(floorScene, camera);

		// If the scene group hasn't been created yet, find it
		const sceneGroup = scene.children.find((node) => node.type === 'Group');

		if (!sceneGroup) return;

		for (const node of sceneGroup.children) {
			const checkNodes = [node];

			if (node.type === 'Group') {
				for (const child of node.children) {
					if (!child.material) continue;

					checkNodes.push(child);
				}
			}

			for (const part of parts) {
				for (const child of checkNodes) {
					if (
						child.name !== part.objectName &&
						child.parent.name !== part.objectName
					)
						continue;

					if (!child.material) continue;

					// Get the world center position of the part
					let center = getCenterPoint(child);

					// Offset the center point if the part has an offset
					center.x += part.offsetX || 0;
					center.y += part.offsetY || 0;
					center.z += part.offsetZ || 0;

					// Convert the world center point to screen coordinates
					const { x: screenX, y: screenY } = centerPointToScreen(
						center,
						camera
					);

					// Move the part label to the screen coordinates
					part.partLabel.style.top = `${screenY}px`;
					part.partLabel.style.left = `${screenX}px`;

					part.x = screenX;
					part.y = screenY;

					// Find the closest part to this part
					let closestDistance = 0;

					for (const otherPart of parts) {
						if (otherPart === part) continue;

						// Calculate the distance between the two parts
						const distance = Math.sqrt(
							Math.pow(part.x - otherPart.x, 2) +
								Math.pow(part.y - otherPart.y, 2)
						);

						if (
							distance < closestDistance ||
							closestDistance === 0
						) {
							closestDistance = distance;
						}
					}

					// Update the parts opacity based on the distance to the closest part
					part.partLabel.style.color = `rgba(255, 255, 255, ${Math.max(
						closestDistance / 100,
						0.1
					)})`;
				}
			}
		}
	}

	init() {
		this.createLoaders();
		this.createScenes();
		this.createCamera();
		this.createRenderer();
		this.createControls();
		this.addMouseEvents();
		this.createParts();
		this.loadModel();
		this.loadFloor();
		this.createLights();

		this.resize();
		window.addEventListener('resize', this.resize.bind(this));

		this.animate();
	}

	componentDidMount() {
		this.init();
	}

	render() {
		return (
			<>
				<div className='body-content' ref={this.bodyContentRef}>
					<div
						className={`help-screen ${
							this.state.helpScreenOpen && 'help-screen-open'
						}`}>
						<div className='help-content'>
							<div className='header'>
								<div className='header-left'>
									<FontAwesomeIcon
										icon={faTimes}
										size='lg'
										className='close-icon button-icon'
										onClick={this.toggleHelpScreen.bind(
											this
										)}
									/>
									<span className='part-name'>
										{this.state.selectedPart?.name}
									</span>
								</div>
								<FontAwesomeIcon
									icon={faInfoCircle}
									size='lg'
									className='button-icon'
								/>
							</div>
							<span className='part-description'>
								{this.state.selectedPart?.description}
							</span>
							<HorizontalSelector
								options={[
									{ label: 'Repair', icon: faHammer },
									{ label: 'Upgrade', icon: faWrench },
								]}
							/>
						</div>
						<Button
							label='Close'
							icon={faTimes}
							danger
							onClick={this.toggleHelpScreen.bind(this)}
						/>
					</div>
				</div>
				<Footer />
			</>
		);
	}
}

export default App;
