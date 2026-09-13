"""Author an original City-boy study, export a web mesh and render its transport pose.

Run with Blender 5: blender --background --python models/build_cityboy.py
References and scope are documented in models/README.md. No downloaded geometry.
"""
import bpy
import bmesh
import math
import os
from collections import defaultdict
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ASSETS, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, hex_color, metallic=0.0, roughness=0.5):
    rgb = tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    # Blender node colors are linear, whereas the reference palette is sRGB.
    linear = tuple(c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*linear, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*linear, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return mat

MATS = {
    'paint': material('City-boy / warm yellow paint', 'e9b92d', .22, .32),
    'edge': material('Paint / recessed joints', 'a87b19', .3, .42),
    'dark': material('Chassis / graphite', '293332', .42, .43),
    'glass': material('Cab / blue-grey laminated glazing', '244650', .38, .16),
    'rubber': material('Tires / rubber', '202827', 0, .84),
    'steel': material('Pins / galvanized steel', 'a7b2b2', .75, .3),
    'light': material('Lamps / warm white', 'f6eed2', .1, .21),
    'red': material('Tail lights / red', 'a8271e', .2, .3),
    'white': material('Markings / ivory', 'eeeee6', .05, .5),
}

class Builder:
    """One mesh per material; individual details do not add web draw calls."""
    def __init__(self):
        self.parts = defaultdict(lambda: [[], [], []])

    def mesh(self, material, vertices, faces, smooth=False):
        data = self.parts[material]
        offset = len(data[0])
        data[0].extend(vertices)
        data[1].extend(tuple(v + offset for v in face) for face in faces)
        data[2].extend([smooth] * len(faces))

    def box(self, material, center, size, bevel=0):
        x, y, z = center
        a, b, c = (v / 2 for v in size)
        vertices = [(x+sx*a, y+sy*b, z+sz*c) for sx,sy,sz in
                    [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),
                     (-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        faces = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        if not bevel:
            self.mesh(material, vertices, faces)
            return
        bm = bmesh.new()
        verts = [bm.verts.new(v) for v in vertices]
        for f in faces:
            bm.faces.new([verts[i] for i in f])
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel,a*.4,b*.4,c*.4), segments=2, affect='EDGES')
        bm.verts.ensure_lookup_table()
        for i,v in enumerate(bm.verts): v.index = i
        self.mesh(material, [tuple(v.co) for v in bm.verts], [tuple(v.index for v in f.verts) for f in bm.faces])
        bm.free()

    def rod(self, material, a, b, r, segments=8):
        a, b = Vector(a), Vector(b)
        n = (b-a).normalized()
        u = n.cross(Vector((0,0,1)) if abs(n.z)<.9 else Vector((0,1,0))).normalized()
        v = n.cross(u)
        vertices = [tuple(p + r*(math.cos(i*math.tau/segments)*u + math.sin(i*math.tau/segments)*v))
                    for p in (a,b) for i in range(segments)]
        sides = [(i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments)]
        self.mesh(material, vertices, sides, True)
        self.mesh(material, vertices, [tuple(range(segments-1,-1,-1)),tuple(range(segments,2*segments))])

    def extrude(self, material, outline, y0, y1):
        # An authored side silhouette extruded across the machine's width.
        n = len(outline)
        vertices = [(x,y,z) for y in (y0,y1) for x,z in outline]
        faces = [tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        self.mesh(material, vertices, faces)

    def finish(self, name):
        root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(root)
        for key,(vertices,faces,smooth) in self.parts.items():
            mesh = bpy.data.meshes.new(name + '/' + key)
            mesh.from_pydata(vertices, [], faces)
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(mesh)
            bm.free()
            mesh.materials.append(MATS[key])
            mesh.update()
            for poly, shade in zip(mesh.polygons,smooth): poly.use_smooth=shade
            obj = bpy.data.objects.new(name + '/' + key, mesh)
            bpy.context.collection.objects.link(obj)
            obj.parent = root
        return root

def wheel(b,x,y):
    # Revolved tire profile with shoulders, sidewalls, rim and wheel nuts.
    rings = [(-.25,.44),(-.24,.53),(-.17,.59),(.17,.59),(.24,.53),(.25,.44)]
    segments = 28
    vertices = [(x + radius*math.cos(i*math.tau/segments),y+offset,.77+radius*math.sin(i*math.tau/segments))
                for offset,radius in rings for i in range(segments)]
    faces = [(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i)
             for j in range(len(rings)-1) for i in range(segments)]
    b.mesh('rubber', vertices, faces, True)
    side = -1 if y<0 else 1
    outer=y+side*.256
    b.rod('dark',(x,y-.2,.77),(x,y+.2,.77),.43,24)
    b.rod('paint',(x,outer-side*.025,.77),(x,outer,.77),.355,24)
    b.rod('steel',(x,outer,.77),(x,outer+side*.04,.77),.18,20)
    for i in range(8):
        angle=i*math.tau/8
        px,pz=x+.265*math.cos(angle),.77+.265*math.sin(angle)
        b.rod('steel',(px,outer,pz),(px,outer+side*.025,pz),.034,6)
    for i in range(28):
        angle=i*math.tau/28
        # Fine blocks on both tread shoulders catch studio lighting.
        for side_y in [-.105,.105]:
            px,pz=x+.59*math.cos(angle),.77+.59*math.sin(angle)
            b.rod('rubber',(px,y+side_y-.075,pz),(px,y+side_y+.075,pz),.027,4)

def carrier(b,transport):
    # 13.08 x 2.55 m road footprint, three axles; deployed stabilizers in work pose.
    b.box('dark',(0,0,.99),(12.9,1.96,.38),.08)
    b.box('paint',(0,0,1.3),(12.98,2.45,.34),.075)
    b.box('steel',(0,0,1.49),(12.55,2.5,.09),.025)
    for x in [3.7,-1.25,-3.65]:
        b.rod('dark',(x,-1.0,.77),(x,1.0,.77),.12,10)
        for y in [-1.06,1.06]: wheel(b,x,y)
    # Low side lockers between the axles, wheel arch decks and rear steps.
    for y in [-1.16,1.16]:
        for x,w in [(1.12,3.18),(-5.36,1.22)]:
            b.box('paint',(x,y,.96),(w,.2,.76),.05)
            b.box('edge',(x-.15,y*1.095,1.03),(.022,.016,.45))
            b.box('steel',(x+.2,y*1.095,1.14),(.18,.02,.035))
        for x in [3.7,-1.25,-3.65]:
            b.box('dark',(x,y,1.43),(1.43,.4,.105),.02)
    # Bodywork is carried by the turntable; it is not a truck with a separate cab.
    body_z = 2.39 if transport else 2.21
    body_h = 1.75 if transport else 1.42
    b.box('paint',(-2.8,0,body_z),(4.05,2.1,body_h),.12)
    for x in [-3.85,-2.5,-1.14]:
        b.box('edge',(x,-1.058,body_z),(1.22,.026,body_h-.24),.04)
        b.box('paint',(x,-1.08,body_z),(1.15,.025,body_h-.31),.03)
        b.box('steel',(x+.35,-1.1,body_z+.2),(.055,.027,.14))
    for x in [-4.23+i*.18 for i in range(16)]:
        b.box('dark',(x,1.062,2.1),(.047,.02,.81))
    b.box('dark',(-5.18,0,2.0),(1.03,1.98,1.02),.035)
    for z in [1.63,1.9,2.17,2.44]:
        b.box('paint',(-5.2,0,z),(1.12,2.05,.035))
    b.rod('dark',(3.55,0,1.48),(3.55,0,1.75),.92,36)
    # Tall corner jack housings and square support mats.
    for x in [-5.58,5.5]:
        for sign in [-1,1]:
            y=sign*(1.16 if transport else 3.55)
            b.box('paint',(x,sign*(.8 if transport else 2.03),1.1),(.37,1 if transport else 3.26,.33),.025)
            b.box('paint',(x,y,1.18),(.34,.36,1.32),.035)
            b.rod('steel',(x,y,.65 if transport else .22),(x,y,1.22),.08,12)
            b.box('dark',(x,y,.6 if transport else .16),(.38 if transport else .76,.36 if transport else .72,.12),.04)
            for z in [.55,.85,1.15]:
                b.box('edge',(x+.18,y,z),(.012,.23,.025))
    # Lighting, towing points, rear ladder and exposed plumbing.
    for y in [-.94,.94]:
        b.box('dark',(6.51,y,1.13),(.045,.28,.3),.03)
        for z in [1.04,1.19]: b.rod('light',(6.52,y,z),(6.56,y,z),.07,12)
        b.box('red',(-6.52,y,1.15),(.035,.22,.08),.015)
    b.box('dark',(6.56,0,.9),(.12,.58,.12),.03)
    for z in [.59,.9,1.2]:
        b.box('steel',(-6.15,-1.25,z),(.4,.28,.055))
    for x in [-6.35,-5.95]:
        b.rod('paint',(x,-1.32,1.2),(x,-1.32,2.4),.025)
    b.rod('paint',(-6.35,-1.32,2.4),(-5.95,-1.32,2.4),.025)

def cabin(b,origin,raised=False):
    ox,oy,oz=origin
    cab = Builder()
    target = b
    b = cab
    # Build locally, then stretch the single long cabin across half the carrier.
    ox = oy = oz = 0
    # A long angular wraparound cab, offset to the side of the folding tower.
    silhouette=[(-1.55,0),(1.55,0),(1.7,.36),(1.58,1.87),(1.17,2.18),(-1.42,2.18),(-1.67,1.65)]
    shifted=[(x+ox,z+oz) for x,z in silhouette]
    b.extrude('paint',shifted,oy-.7,oy+.7)
    sideglass=[(-1.44,.83),(.88,.72),(1.48,.92),(1.4,1.82),(1.07,2.02),(-1.39,2.02)]
    for sign in [-1,1]:
        b.extrude('glass',[(x+ox,z+oz) for x,z in sideglass],oy+sign*.706,oy+sign*.719)
        # Glazing mullions, door seam and handle.
        b.rod('dark',(ox-.75,oy+sign*.726,oz+.8),(ox-.75,oy+sign*.726,oz+2.02),.026)
        b.rod('dark',(ox+.61,oy+sign*.726,oz+.78),(ox+.75,oy+sign*.726,oz+2.02),.026)
        b.box('dark',(ox-.2,oy+sign*.723,oz+.68),(1.4,.02,.08))
        b.box('steel',(ox-.56,oy+sign*.755,oz+.74),(.18,.04,.035))
    # A raked full-height windshield; discrete gasket and wiper.
    vertices=[(ox+1.714,oy-.59,oz+.37),(ox+1.714,oy+.59,oz+.37),
              (ox+1.599,oy+.59,oz+1.82),(ox+1.599,oy-.59,oz+1.82)]
    b.mesh('glass',vertices,[(0,1,2,3)])
    b.rod('dark',(ox+1.713,oy-.1,oz+.51),(ox+1.631,oy+.29,oz+1.51),.02)
    b.box('dark',(ox+1.63,oy,oz+.22),(.08,1.01,.13),.02)
    for sign in [-1,1]:
        b.rod('steel',(ox+1.15,oy+sign*.7,oz+1.63),(ox+1.43,oy+sign*.94,oz+1.57),.023)
        b.box('dark',(ox+1.44,oy+sign*.95,oz+1.48),(.1,.17,.28),.035)
    b.box('paint',(ox,oy,oz+2.205),(2.74,1.46,.055),.025)
    if raised:
        b.box('steel',(ox,oy,oz-.13),(3.08,1.54,.14),.03)
    # Sculpted side-door lower panel, front glass continuing down to the floor.
    for sign in [-1, 1]:
        b.extrude('dark',[(.7,.21),(1.52,.28),(1.48,.92),(.88,.72)],sign*.724,sign*.731)
        b.rod('edge',(-.67,sign*.727,.12),(-.67,sign*.727,.8),.014,6)
    for key, (vertices,faces,smooth) in cab.parts.items():
        transformed=[(x*1.64+origin[0],y+origin[1],z*.79+origin[2]) for x,y,z in vertices]
        offset=len(target.parts[key][0])
        target.parts[key][0].extend(transformed)
        target.parts[key][1].extend(tuple(i+offset for i in f) for f in faces)
        target.parts[key][2].extend(smooth)

def truss(b,start,length,height=.85,width=.9):
    x,y,z=start
    # Triangular lattice sections with taper, hinges and upper bracing.
    count=math.ceil(length/1.22)
    for i in range(count):
        a=length*i/count;c=length*(i+1)/count
        taper_a=1-.52*a/length;taper_c=1-.52*c/length
        baseA=[(x+a,y-width*taper_a/2,z),(x+a,y+width*taper_a/2,z)]
        baseC=[(x+c,y-width*taper_c/2,z),(x+c,y+width*taper_c/2,z)]
        topA=(x+a,y,z+height*taper_a);topC=(x+c,y,z+height*taper_c)
        for j in [0,1]:
            b.rod('paint',baseA[j],baseC[j],.059,8)
            b.rod('paint',baseA[j],topC,.036,6)
            b.rod('paint',topA,baseC[j],.03,6)
        b.rod('paint',topA,topC,.064,8)
        b.rod('paint',baseA[0],baseC[1],.029,6)
        if i%7==0:
            for p in baseA:b.rod('steel',(p[0],p[1]-.08,p[2]),(p[0],p[1]+.08,p[2]),.085,10)

def working():
    b=Builder();carrier(b,False)
    # Three nested closed tower sections, with cable guides and extension collars.
    px=3.55
    b.box('paint',(px,0,1.97),(1.26,1.06,.4),.05)
    for z0,z1,w,d in [(2.15,12.5,.98,.88),(12.4,22.3,.77,.7),(22.2,31.6,.58,.56)]:
        b.box('paint',(px,0,(z0+z1)/2),(w,d,z1-z0),.035)
        b.box('edge',(px,0,z1-.08),(w+.15,d+.13,.2),.018)
        b.box('paint',(px,0,z1+.1),(w+.12,d+.11,.13),.014)
        b.rod('steel',(px+.1,-d/2-.08,z0),(px+.1,-d/2-.08,z1),.037,10)
        for z in [z0+.7+i*1.2 for i in range(int((z1-z0)/1.2))]:
            b.box('dark',(px-.15,-d/2-.02,z),(.2,.045,.065))
    # Continuous lift rail and a dark cable carrier on the mast's side.
    for y in [-.61,.61]:
        b.rod('steel',(px-.28,y,2.4),(px-.28,y,30.3),.032,8)
        for z in [3+i*2 for i in range(14)]:
            b.rod('paint',(px-.28,y,z),(px+.16,y,z),.026,6)
    b.box('dark',(px-.54,.51,16.1),(.095,.075,26.2))
    # The driving cab is raised up the tower in working configuration.
    cabin(b,(px-1.3,-1.13,26.2),True)
    for y in [-.39,.39]:
        b.rod('paint',(px-1.24,y,1.7),(px,y,3.65),.115,12)
        b.rod('steel',(px-1.8,y,1.7),(px-.4,y,3.08),.07,10)
    b.box('dark',(px,0,31.71),(.83,.88,.28),.035)
    # Long folding jib with several elevated suspension masts, not a top slewer's counter-jib.
    truss(b,(px,0,32.0),40,.86,.92)
    for x,h in [(px,3.28),(px+12.7,2.28),(px+23.2,1.65)]:
        b.rod('paint',(x,0,32.55),(x,0,32.55+h),.061,8)
        b.rod('steel',(x-.16,-.13,32.7),(x+.16,.13,32.7),.07,10)
    for a,c in [((px,0,35.83),(px+12.7,0,34.83)),
                ((px+12.7,0,34.83),(px+23.2,0,34.2)),
                ((px+23.2,0,34.2),(px+39.3,0,32.46)),
                ((px,0,35.83),(px+12.7,0,32.8)),
                ((px+12.7,0,34.83),(px+23.2,0,32.6))]:
        b.rod('steel',a,c,.022,6)
    # Rear-folding suspension stays return to ballast mounted on the carrier.
    b.rod('paint',(px,0,35.83),(px-3.8,0,33.7),.05,8)
    b.rod('paint',(px-3.8,0,33.7),(px,0,32.3),.05,8)
    for y in [-.26,.26]:
        b.rod('steel',(px-3.8,y,33.7),(-3.4,y,2.94),.022,6)
    # Four-fall reeving, with separate local origins for the web hoist animation.
    hx=px+28.4
    b.box('dark',(hx,0,31.85),(.7,1.02,.25),.035)
    lines=Builder()
    for y in [-.2,-.067,.067,.2]:
        lines.rod('dark',(hx,y,0),(hx,y,-11.75),.015,5)
    hook=Builder()
    hook.box('paint',(hx,0,0),(.38,.63,.6),.08)
    hook.rod('steel',(hx,-.36,.03),(hx,.36,.03),.12,16)
    pts=[(hx,0,-.26),(hx,0,-.46),(hx+.15,0,-.67),(hx+.35,0,-.65),(hx+.43,0,-.45)]
    for a,c in zip(pts,pts[1:]):hook.rod('dark',a,c,.07,10)
    root=b.finish('CityBoy_Working')
    hoist_lines=lines.finish('CityBoy_HoistLines');hoist_lines.parent=root;hoist_lines.location.z=31.8
    hoist_hook=hook.finish('CityBoy_Hook');hoist_hook.parent=root;hoist_hook.location.z=19.84
    return root

def transport():
    b=Builder();carrier(b,True)
    # Raised cab comes down to the nose, next to the folded tower.
    cabin(b,(3.3,-.39,1.52))
    for z in [1.65,1.94,2.23,2.52,2.81,3.10]:
        b.rod('paint',(-.56,-1.06,z),(-.56,-.68,z),.027,8)
    # Mast and hinge mechanism nest beside the cab and above the carrier.
    b.box('paint',(-.5,.53,3.12),(10.2,.66,.54),.04)
    b.box('steel',(-.5,.18,3.17),(9.8,.045,.045))
    for x in [-4.5,-2,.5,3]:
        b.box('edge',(x,.53,3.12),(.13,.73,.66),.015)
    for y in [.21,.86]:
        b.rod('paint',(6.05,y,2.01),(4.6,y,3.52),.13,12)
        b.rod('steel',(6.05,y,2.29),(4.85,y,3.52),.065,10)
        b.rod('steel',(5.72,y-.15,2.24),(5.72,y+.15,2.24),.21,16)
    # Three folded jib sections, parallel chord stacks and visible folding pins.
    truss(b,(-6.15,-.32,3.52),12.3,.6,1.02)
    truss(b,(-5.88,.53,3.59),11.84,.55,.66)
    for x in [-5.97,5.75]:
        b.rod('paint',(x,-.86,3.55),(x,.84,3.55),.13,12)
        b.rod('dark',(x,-.91,3.55),(x,.91,3.55),.061,12)
    for y in [-.58,.7]:
        b.rod('steel',(-5.6,y,4.06),(5.28,y,4.08),.025,6)
    # Work hoses, bumper detailing and equipment near the folding hinge.
    for i in range(5):
        b.rod('dark',(5.87,.11+i*.11,1.75),(5.31,.11+i*.11,3.37),.026,6)
    return b.finish('CityBoy_Transport')

work=working()
road=transport()

# Save the editable asset with both poses; the work pose alone goes to the browser.
work['reference'] = 'Spierings SK487-AT3 City Boy public product photos; original visual study'
work['axles'] = 3
work['road_length_m'] = 13.08
work['jib_length_m'] = 40
work['geometry_scope'] = 'Visual interpretation, not manufacturer CAD'
for root in [work,road]:
    for obj in root.children:
        obj.select_set(False)
bpy.ops.object.select_all(action='DESELECT')
work.select_set(True)
for obj in work.children_recursive:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ASSETS,'cityboy-working.glb'),export_format='GLB',
                          use_selection=True,export_apply=True,export_texcoords=False,
                          export_normals=True,export_materials='EXPORT',export_extras=True)

# A separate studio configuration uses the same authored construction details.
for obj in [work,*work.children_recursive]:obj.hide_render=True;obj.hide_set(True)
studio=bpy.data.collections.new('Studio');bpy.context.scene.collection.children.link(studio)
def to_studio(obj):
    for collection in list(obj.users_collection):collection.objects.unlink(obj)
    studio.objects.link(obj)

ground=material('Studio / warm grey', 'dfe5da',0,.83)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.18))
floor=bpy.context.object;floor.name='Studio_floor';floor.data.materials.append(ground);to_studio(floor)

def area(name,location,power,size,target):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);studio.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
area('Key softbox',(6,-8,14),2600,9,(0,0,1.6))
area('Rim strip',(-5,6,10),3400,8,(0,0,2))
area('Front fill',(10,3,7),1700,7,(1,0,2))
bpy.ops.object.camera_add(location=(19,-27,11))
camera=bpy.context.object;camera.name='Studio_camera';to_studio(camera)
camera.rotation_euler=(Vector((0,0,2.0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=18.7;bpy.context.scene.camera=camera
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=820;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=90
scene.render.filepath=os.path.join(ASSETS,'cityboy-studio.jpg')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.46,.52,.47,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'
scene.render.film_transparent=False
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'models','cityboy.blend'),compress=True)
bpy.ops.render.render(write_still=True)
print('CITYBOY_ASSETS_READY')
