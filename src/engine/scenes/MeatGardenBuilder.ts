import * as THREE from 'three';

export interface FoodModelItem {
  id: string;
  name: string;
  category: 'poultry' | 'meat' | 'seafood';
  cutType: string;
  group: THREE.Group;
  initialPos: THREE.Vector3;
  initialRot: THREE.Euler;
  floatSpeed: number;
  floatAmplitude: number;
  rotSpeed: THREE.Vector3;
}

export class MeatGardenBuilder {
  /**
   * Generates procedural normal/bump map for organic meat muscle fibers and food skin
   */
  private static createMeatTexture(type: 'poultry' | 'meat' | 'fish' | 'prawn'): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'poultry') {
      // Tender poultry skin with tiny pores and fine grain
      ctx.fillStyle = '#FFE6DC';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.5 + 0.5;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 230, 220, 0.4)' : 'rgba(220, 160, 150, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'meat') {
      // Deep red meat with natural marbled fat striations
      ctx.fillStyle = '#9B1B30';
      ctx.fillRect(0, 0, size, size);
      // Draw wavy white fat lines (marbling)
      ctx.strokeStyle = 'rgba(255, 245, 238, 0.45)';
      ctx.lineWidth = 3;
      for (let j = 0; j < 35; j++) {
        ctx.beginPath();
        let y = j * (size / 35) + Math.random() * 10;
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 30) {
          y += (Math.random() - 0.5) * 16;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (type === 'fish') {
      // Coral-salmon flesh with distinct parallel white connective lines
      ctx.fillStyle = '#FA8072';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 4;
      for (let k = 0; k < 25; k++) {
        ctx.beginPath();
        const y0 = k * (size / 22) - 50;
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(size * 0.35, y0 + 40, size * 0.65, y0 + 20, size, y0 + 60);
        ctx.stroke();
      }
    } else if (type === 'prawn') {
      // Tiger prawn shell segments with coral-pink bands
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#FF7F50');
      grad.addColorStop(0.5, '#FFA07A');
      grad.addColorStop(1, '#FF6347');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 6;
      for (let p = 0; p < 12; p++) {
        const y = p * (size / 10);
        ctx.beginPath();
        ctx.arc(size / 2, y, size * 0.4, 0, Math.PI);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }

  /**
   * 1. Realistic Chicken Drumstick: Bone knuckle + bulbous meat with fresh poultry specularity
   */
  public static createChickenDrumstick(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ChickenDrumstick';

    const poultryTex = this.createMeatTexture('poultry');

    // Meat Material
    const meatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFD6C4'),
      map: poultryTex,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      transmission: 0.12,
      thickness: 0.5,
      attenuationColor: new THREE.Color('#E07A5F')
    });

    // Bone Material (Ivory porcelain)
    const boneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FAF3EB'),
      roughness: 0.45,
      metalness: 0.02
    });

    // Meat Head: Sculpted bulbous lathe curve
    const meatPoints = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.35, 0.15),
      new THREE.Vector2(0.68, 0.45),
      new THREE.Vector2(0.78, 0.85),
      new THREE.Vector2(0.74, 1.25),
      new THREE.Vector2(0.52, 1.65),
      new THREE.Vector2(0.32, 1.95),
      new THREE.Vector2(0.18, 2.15),
      new THREE.Vector2(0.01, 2.2)
    ];
    const meatGeo = new THREE.LatheGeometry(meatPoints, 32);
    // Add subtle asymmetry
    const pos = meatGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const wobble = Math.sin(angle * 2.0) * 0.08 * (1.0 - Math.abs(y - 1.0) / 1.5);
      pos.setX(i, pos.getX(i) + Math.cos(angle) * wobble);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * wobble);
    }
    meatGeo.computeVertexNormals();
    const meatMesh = new THREE.Mesh(meatGeo, meatMat);
    group.add(meatMesh);

    // Bone Shaft
    const boneShaftGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.1, 24);
    const boneShaft = new THREE.Mesh(boneShaftGeo, boneMat);
    boneShaft.position.set(0, 2.5, 0);
    group.add(boneShaft);

    // Bone Knuckle (two rounded condyle spheres)
    const knuckleGeo = new THREE.SphereGeometry(0.19, 16, 16);
    const knuckle1 = new THREE.Mesh(knuckleGeo, boneMat);
    knuckle1.position.set(0.12, 3.05, 0);
    const knuckle2 = new THREE.Mesh(knuckleGeo, boneMat);
    knuckle2.position.set(-0.12, 3.05, 0);
    group.add(knuckle1, knuckle2);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  /**
   * 2. Chicken Breast Fillet: Sculpted curved teardrop fillet
   */
  public static createChickenBreast(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ChickenBreast';

    const poultryTex = this.createMeatTexture('poultry');
    const breastMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFD1C1'),
      map: poultryTex,
      roughness: 0.35,
      metalness: 0.04,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      transmission: 0.15,
      thickness: 0.6,
      attenuationColor: new THREE.Color('#E57373')
    });

    // Teardrop profile using parametric sphere squashing
    const breastGeo = new THREE.SphereGeometry(1.0, 36, 28);
    const pos = breastGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Taper bottom into teardrop point
      const taper = (y + 1.0) * 0.5; // 0 at bottom, 1 at top
      x *= 0.5 + taper * 0.65;
      z *= 0.38 + taper * 0.32; // flat profile
      // Slight gentle curve
      x += Math.sin(y * 1.5) * 0.2;
      pos.setXYZ(i, x * 1.2, y * 1.5, z * 0.85);
    }
    breastGeo.computeVertexNormals();

    const breastMesh = new THREE.Mesh(breastGeo, breastMat);
    group.add(breastMesh);
    group.scale.set(0.7, 0.7, 0.7);
    return group;
  }

  /**
   * 3. Artisanal Lamb Chop: Signature curved rib bone extending from marbled red loin medallion
   */
  public static createLambChop(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'LambChop';

    const meatTex = this.createMeatTexture('meat');

    // Rich Red Lamb Meat Material
    const lambMeatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#A81D34'),
      map: meatTex,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      transmission: 0.1,
      thickness: 0.4,
      attenuationColor: new THREE.Color('#8B0000')
    });

    // Fat Rim Material (creamy white marbled edge)
    const fatMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFF5EE'),
      roughness: 0.35,
      metalness: 0.02
    });

    // Bone Material
    const boneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F7F0E6'),
      roughness: 0.4,
      metalness: 0.03
    });

    // Loin Eye Medallion (Cylinder extruded with organic oval shape)
    const meatShape = new THREE.Shape();
    meatShape.moveTo(0, 0);
    meatShape.bezierCurveTo(0.6, 0.2, 0.9, 0.8, 0.6, 1.4);
    meatShape.bezierCurveTo(0.3, 1.8, -0.4, 1.7, -0.7, 1.2);
    meatShape.bezierCurveTo(-0.9, 0.7, -0.6, 0.1, 0, 0);

    const extrudeSettings = {
      steps: 4,
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 4
    };

    const meatGeo = new THREE.ExtrudeGeometry(meatShape, extrudeSettings);
    meatGeo.center();
    const meatMesh = new THREE.Mesh(meatGeo, lambMeatMat);
    group.add(meatMesh);

    // Fat Cap Crescent Rim along the outer curvature
    const fatCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.55, 0.1, 0),
      new THREE.Vector3(0.95, 0.8, 0),
      new THREE.Vector3(0.55, 1.45, 0)
    );
    const fatGeo = new THREE.TubeGeometry(fatCurve, 20, 0.12, 12, false);
    const fatMesh = new THREE.Mesh(fatGeo, fatMat);
    group.add(fatMesh);

    // Long curved Rib Bone
    const boneCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.4, 0.8, 0),
      new THREE.Vector3(-1.1, 1.3, 0),
      new THREE.Vector3(-1.7, 2.1, 0),
      new THREE.Vector3(-2.2, 2.8, 0)
    );
    const boneGeo = new THREE.TubeGeometry(boneCurve, 24, 0.09, 12, false);
    const boneMesh = new THREE.Mesh(boneGeo, boneMat);
    group.add(boneMesh);

    group.scale.set(0.6, 0.6, 0.6);
    return group;
  }

  /**
   * 4. Succulent Salmon / Fish Fillet with distinctive fat striations
   */
  public static createFishFillet(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'FishFillet';

    const fishTex = this.createMeatTexture('fish');

    const fishMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FF7F50'),
      map: fishTex,
      roughness: 0.22,
      metalness: 0.06,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
      transmission: 0.18,
      thickness: 0.5,
      attenuationColor: new THREE.Color('#FF4500')
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6E7B8B'),
      metalness: 0.45,
      roughness: 0.35
    });

    // Sculpted wedge steak cut
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, -0.6);
    shape.lineTo(1.2, -0.6);
    shape.bezierCurveTo(1.4, 0.2, 1.1, 0.7, 0.6, 0.8);
    shape.lineTo(-0.8, 0.8);
    shape.bezierCurveTo(-1.3, 0.5, -1.4, -0.2, -1.2, -0.6);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 4
    });
    geo.center();

    const filletMesh = new THREE.Mesh(geo, fishMat);
    group.add(filletMesh);

    // Silver skin bottom plate
    const skinGeo = new THREE.PlaneGeometry(2.6, 0.58);
    const skinMesh = new THREE.Mesh(skinGeo, skinMat);
    skinMesh.rotation.x = Math.PI / 2;
    skinMesh.position.y = -0.62;
    group.add(skinMesh);

    group.scale.set(0.68, 0.68, 0.68);
    return group;
  }

  /**
   * 5. Fresh Tiger Prawn / Jumbo Shrimp: Curved segmented shell body with pearlescent luster
   */
  public static createTigerPrawn(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'TigerPrawn';

    const prawnTex = this.createMeatTexture('prawn');

    const prawnMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFA07A'),
      map: prawnTex,
      roughness: 0.26,
      metalness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      transmission: 0.22,
      thickness: 0.6,
      attenuationColor: new THREE.Color('#FF6347')
    });

    // Prawn C-shape curved tube
    const prawnCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.9, 0.8, 0),
      new THREE.Vector3(-0.9, 0.5, 0),
      new THREE.Vector3(0.7, -0.9, 0)
    );

    // Segmented rings along the curve
    const prawnGeo = new THREE.TubeGeometry(prawnCurve, 32, 0.32, 16, false);
    // Taper towards tail
    const pos = prawnGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (i / pos.count);
      const scale = 1.0 - u * 0.45;
      pos.setZ(i, pos.getZ(i) * scale);
    }
    prawnGeo.computeVertexNormals();

    const prawnMesh = new THREE.Mesh(prawnGeo, prawnMat);
    group.add(prawnMesh);

    // Tail Fan (two flat fin triangles)
    const tailMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FF6347'),
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const tailGeo = new THREE.ConeGeometry(0.25, 0.55, 3);
    const tailFin1 = new THREE.Mesh(tailGeo, tailMat);
    tailFin1.position.set(0.85, -1.05, 0.1);
    tailFin1.rotation.z = Math.PI * 0.7;

    const tailFin2 = new THREE.Mesh(tailGeo, tailMat);
    tailFin2.position.set(0.85, -1.05, -0.1);
    tailFin2.rotation.z = Math.PI * 0.6;
    group.add(tailFin1, tailFin2);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  /**
   * 6. Premium Beef Tenderloin Medallion / Steak Cut
   */
  public static createBeefSteak(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'BeefSteak';

    const meatTex = this.createMeatTexture('meat');
    const steakMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8B0000'),
      map: meatTex,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      transmission: 0.1,
      thickness: 0.5,
      attenuationColor: new THREE.Color('#4A0000')
    });

    const steakGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.65, 32);
    // Add organic marbled edge wobble
    const pos = steakGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const wobble = Math.sin(angle * 3.0) * 0.08 + Math.cos(angle * 5.0) * 0.04;
      pos.setX(i, pos.getX(i) + Math.cos(angle) * wobble);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * wobble);
    }
    steakGeo.computeVertexNormals();

    const steakMesh = new THREE.Mesh(steakGeo, steakMat);
    group.add(steakMesh);
    group.scale.set(0.7, 0.7, 0.7);
    return group;
  }

  /**
   * Builds the entire spatial garden composition of meat & seafood models
   */
  public static buildGardenCollection(): FoodModelItem[] {
    const items: FoodModelItem[] = [];

    // 1. Poultry Cut 1: Farm-Fresh Chicken Drumstick (Left Upper Wing)
    const drumstick = this.createChickenDrumstick();
    drumstick.scale.set(0.46, 0.46, 0.46);
    drumstick.position.set(-2.4, 0.45, 0.1);
    drumstick.rotation.set(0.3, 0.4, -0.6);
    items.push({
      id: 'poultry-drumstick',
      name: 'Farm-Fresh Chicken Drumstick',
      category: 'poultry',
      cutType: 'Bone-in Prime Poultry Cut',
      group: drumstick,
      initialPos: drumstick.position.clone(),
      initialRot: drumstick.rotation.clone(),
      floatSpeed: 0.7,
      floatAmplitude: 0.06,
      rotSpeed: new THREE.Vector3(0.002, 0.003, 0.001)
    });

    // 2. Poultry Cut 2: Tender Chicken Breast Fillet (Left Lower Wing)
    const chickenBreast = this.createChickenBreast();
    chickenBreast.scale.set(0.44, 0.44, 0.44);
    chickenBreast.position.set(-2.7, -0.95, -0.3);
    chickenBreast.rotation.set(-0.2, 0.6, 0.4);
    items.push({
      id: 'poultry-breast',
      name: 'Tender Chicken Breast Fillet',
      category: 'poultry',
      cutType: 'Skinless Boneless Fillet',
      group: chickenBreast,
      initialPos: chickenBreast.position.clone(),
      initialRot: chickenBreast.rotation.clone(),
      floatSpeed: 0.6,
      floatAmplitude: 0.05,
      rotSpeed: new THREE.Vector3(0.001, 0.002, -0.001)
    });

    // 3. Red Meat Cut 1: Artisanal Lamb Chop (Lower Center-Left Negative Space)
    const lambChop = this.createLambChop();
    lambChop.scale.set(0.42, 0.42, 0.42);
    lambChop.position.set(-1.1, -1.25, 0.1);
    lambChop.rotation.set(0.4, -0.3, 0.5);
    items.push({
      id: 'meat-lambchop',
      name: 'Pasture-Raised Lamb Chop',
      category: 'meat',
      cutType: 'Rib Cut Loin Medallion',
      group: lambChop,
      initialPos: lambChop.position.clone(),
      initialRot: lambChop.rotation.clone(),
      floatSpeed: 0.75,
      floatAmplitude: 0.06,
      rotSpeed: new THREE.Vector3(0.002, -0.002, 0.002)
    });

    // 4. Red Meat Cut 2: Premium Beef Tenderloin Steak (Lower Center-Right Negative Space)
    const beefSteak = this.createBeefSteak();
    beefSteak.scale.set(0.44, 0.44, 0.44);
    beefSteak.position.set(0.9, -1.35, -0.2);
    beefSteak.rotation.set(0.6, 0.2, -0.3);
    items.push({
      id: 'meat-beefsteak',
      name: 'Prime Grass-Fed Tenderloin',
      category: 'meat',
      cutType: 'Hand-Carved Loin Medallion',
      group: beefSteak,
      initialPos: beefSteak.position.clone(),
      initialRot: beefSteak.rotation.clone(),
      floatSpeed: 0.5,
      floatAmplitude: 0.05,
      rotSpeed: new THREE.Vector3(0.001, 0.003, 0.001)
    });

    // 5. Coastal Seafood Cut 1: Wild-Caught Salmon Fillet (Right Upper Wing)
    const salmonFillet = this.createFishFillet();
    salmonFillet.scale.set(0.46, 0.46, 0.46);
    salmonFillet.position.set(2.4, 0.45, 0.1);
    salmonFillet.rotation.set(-0.3, -0.5, 0.2);
    items.push({
      id: 'seafood-salmon',
      name: 'Wild-Caught Salmon Fillet',
      category: 'seafood',
      cutType: 'Skin-on Fresh Coastal Fillet',
      group: salmonFillet,
      initialPos: salmonFillet.position.clone(),
      initialRot: salmonFillet.rotation.clone(),
      floatSpeed: 0.7,
      floatAmplitude: 0.06,
      rotSpeed: new THREE.Vector3(-0.002, 0.002, 0.001)
    });

    // 6. Coastal Seafood Cut 2: Freshwater Jumbo Tiger Prawn (Right Lower Wing)
    const prawn = this.createTigerPrawn();
    prawn.scale.set(0.48, 0.48, 0.48);
    prawn.position.set(2.6, -0.90, -0.2);
    prawn.rotation.set(0.5, 0.7, -0.4);
    items.push({
      id: 'seafood-prawn',
      name: 'Freshwater Jumbo Tiger Prawn',
      category: 'seafood',
      cutType: 'Whole Head-on Shell Prawn',
      group: prawn,
      initialPos: prawn.position.clone(),
      initialRot: prawn.rotation.clone(),
      floatSpeed: 0.85,
      floatAmplitude: 0.07,
      rotSpeed: new THREE.Vector3(0.003, 0.002, -0.002)
    });

    return items;
  }
}
