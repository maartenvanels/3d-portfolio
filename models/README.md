# City-boy visual study

An original, editable Blender model inspired by the Spierings SK487-AT3 City Boy. It replaces the generic truck/tower geometry and the former line drawing. This is a portfolio illustration, not manufacturer CAD or a representation of unreleased City-boy v2 engineering.

## Files

- `cityboy.blend`: both working and transport poses, materials, studio camera and lighting.
- `build_cityboy.py`: reproducible geometry and studio-render source for Blender 5.
- `../assets/cityboy-working.glb`: the working pose, exported in metres with embedded geometry and materials.
- `../assets/cityboy-studio.jpg`: Cycles render of the folded transport pose for both portfolio languages and the WebGL fallback.

Rebuild from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.0\blender.exe' --background --factory-startup --threads 6 --python models/build_cityboy.py
npm run build
npm test
```

The generator overwrites the `.blend`, `.glb` and `.jpg`; save manual Blender changes under a different filename before regenerating. Blender is only needed to edit or regenerate the asset, not to build, serve or view the site.

## Reference

The silhouette was studied from the manufacturer's [SK487-AT3 product page](https://www.spieringscranes.com/de/mobiler-turmdrehkran/sk487-at3-edrive/), [deployed crane photograph](https://www.spieringscranes.com/wp-content/uploads/City-boy-greyback-hotspot-1440x807.jpg), [transport photograph](https://www.spieringscranes.com/wp-content/uploads/SK487-AT3-City-Boy-vrij-schaduw-768x432.png) and [specification sheet](https://www.spieringscranes.com/wp-content/uploads/Specificaties-SK487-AT3-City-Boy_DU.pdf), consulted September 2026. No source photography or downloaded third-party geometry is included.

The defining features are a three-axle carrier, single tilting lift cabin, telescoping closed mast, triangular folding jib and carrier-level counterweight. Both cabin poses use the same geometry. In crane mode the cabin pitches 90 degrees around its lateral axis: the driving roof window faces forward along the jib and the driving windshield faces down. The cabin then sits vertically on its mast carriage. Public dimensions informed the proportions; small details and mechanical connections are simplified.

## Web export

The static structure is merged by material. The hook block and four hoist ropes have separate origins so the rope length follows the hook during opt-in animation. There are no texture maps or remote decoder dependencies. Automated checks enforce a 1.2 MB file budget, fewer than 30,000 triangles and at most 13 mesh draws, verify the hoist connection at both travel limits, and inspect the exported roof glazing to confirm that it is vertical and faces forward in crane mode. The roof window has its own material batch so that this orientation can be checked directly on the exported geometry.
