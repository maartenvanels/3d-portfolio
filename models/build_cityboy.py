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
    'paint': material('City-boy / warm yellow paint', 'f2bf21', .16, .31),
    'edge': material('Paint / recessed joints', 'b38a22', .24, .42),
    'dark': material('Chassis / graphite', '293332', .42, .43),
    'glass': material('Cab / blue-grey laminated glazing', '244650', .38, .16),
    'roofglass': material('Cab / roof window becomes crane windshield', '315962', .38, .16),
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
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel,a*.4,b*.4,c*.4), segments=1, affect='EDGES')
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

# Coordinates in metres: nose +X, width Y, up Z. Overall road length includes
# the jib overhang: it must not be used as the length of the carrier itself.
AXLES = (2.75, -.58, -2.29)  # 3.330 m and 1.710 m, brochure p. 8.
MAST_X = 3.55

def fender(b, x, y):
    # Curved mudguard, with a narrow yellow lip over a dark inner arch.
    outline=[]
    for radius, angles in [(.735, range(0,181,15)),(.665,range(180,-1,-15))]:
        outline.extend((x+radius*math.cos(math.radians(a)),.77+radius*math.sin(math.radians(a))) for a in angles)
    b.extrude('dark',outline,y-.27,y+.27)
    sign=1 if y>0 else -1
    lip=[(x+r*math.cos(math.radians(a)),.77+r*math.sin(math.radians(a)))
         for r,angles in [(.746,range(0,181,15)),(.712,range(180,-1,-15))] for a in angles]
    b.extrude('paint',lip,y+sign*.265,y+sign*.29)
    b.box('rubber',(x-.7,y,.65),(.05,.47,.42))

def carrier(b,transport):
    b.box('dark',(.095,0,.94),(9.81,1.82,.35),.06)
    b.box('paint',(.095,0,1.36),(9.81,2.42,.17),.04)
    b.box('steel',(.095,0,1.48),(9.77,2.5,.07),.015)
    for x in AXLES:
        b.rod('dark',(x,-1,.77),(x,1,.77),.12,8)
        for y in [-1.02,1.02]:
            wheel(b,x,y)
            fender(b,x,y)
    for sign in [-1,1]:
        y=sign*1.19
        # Two unequal storage bays between the first and second axle.
        for x,w in [(1.51,.75),(.59,.99)]:
            b.box('paint',(x,y,.96),(w,.16,.86),.04)
            b.box('dark',(x+w*.3,y*1.015,1.2),(.045,.027,.12))
        b.box('dark',(.58,y*1.017,.91),(.93,.02,.017))
        # Corner jack housings: 7.20 m longitudinal support spacing.
        for x in [3.585,-3.615]:
            foot_y=sign*(1.12 if transport else 3.55)
            b.box('dark',(x,sign*1.2,1.16),(.44,.39,.45),.02)
            b.box('paint',(x,sign*(.63 if transport else 2.1),1.1),(.31,1.15 if transport else 3.1,.29),.02)
            b.box('paint',(x,foot_y,1.07),(.36,.35,1.17),.04)
            b.rod('steel',(x,foot_y,.41 if transport else .19),(x,foot_y,1.21),.074,10)
            b.box('dark',(x,foot_y,.41 if transport else .16),(.43 if transport else .74,.47 if transport else .74,.1),.02)
            for z in [.59,.9,1.2]:
                b.box('steel',(x+.4,sign*1.19,z),(.35,.22,.045),.008)
            b.rod('paint',(x+.62,sign*1.29,.51),(x+.62,sign*1.29,1.52),.022,6)
        for x in [-3,0,3]:
            b.box('light',(x,sign*1.257,1.49),(.12,.02,.045))
    # Broad sculpted fascia beneath the cantilevered cabin.
    b.extrude('paint',[(4.32,.46),(4.99,.48),(5.06,.68),(5.02,1.43),(4.32,1.43)],-1.19,1.19)
    b.box('edge',(5.065,0,.94),(.015,1.7,.65),.04)
    b.box('paint',(5.08,0,.96),(.025,1.62,.6),.045)
    b.box('dark',(5.1,0,.55),(.065,.55,.105),.025)
    for y in [-1.01,1.01]:
        for z in [.65,.85,1.05]:
            b.rod('dark',(5.07,y,z),(5.13,y,z),.072,12)
            b.rod('light',(5.132,y,z),(5.14,y,z),.048,12)
        b.box('red',(-4.83,y,1.22),(.04,.22,.075),.01)
    # Compact machinery cover, followed by open winch/ballast space.
    b.box('paint',(-.72,0,2.31),(2.48,2.03,1.51),.10)
    for sign in [-1,1]:
        y=sign*1.025
        for z,h in [(2.65,.59),(1.98,.66)]:
            b.box('edge',(-.72,y,z),(2.22,.024,h),.055)
            b.box('paint',(-.72,y+sign*.02,z),(2.15,.027,h-.06),.052)
            b.box('dark',(-.05,y+sign*.045,z+.08),(.045,.025,.11))
        # Ladder in the narrow gap immediately behind the cabin.
        for x in [.63,1.06]:
            b.rod('paint',(x,sign*1.07,1.52),(x,sign*1.07,3.13),.025,8)
        for z in [1.63+i*.255 for i in range(6)]:
            b.rod('steel',(.63,sign*1.085,z),(1.06,sign*1.085,z),.023,6)
    # Low carrier-level ballast; avoid the invented tall stack of crates.
    b.box('dark',(-3.42,0,1.86),(2.15,1.91,.68),.05)
    for z in [1.62,1.84,2.06]:
        b.box('paint',(-3.42,0,z),(2.17,1.96,.026))
    b.rod('dark',(MAST_X,0,1.5),(MAST_X,0,1.72),.84,32)
    for y in [-.72,.72]:
        b.rod('paint',(-4.3,y,1.57),(-4.3,y,2.53),.025,6)
        b.rod('paint',(-4.3,y,2.53),(-3.93,y,2.53),.025,6)
        b.rod('paint',(-3.93,y,2.53),(-3.93,y,1.57),.025,6)

def cabin(b,origin,mode='driving'):
    if mode not in ('driving','crane'):
        raise ValueError('Unknown cabin pose: '+mode)
    target=b
    b=Builder()
    # The complete 3-in-1 cabin includes the rear sliding panel. Its sculpted
    # lower door climbs from the deep front footwell to the rear shoulder.
    outline=[(-2.3,.1),(-2.12,0),(2.05,0),(2.25,.2),(2.3,.55),
             (2.16,1.65),(1.98,1.81),(-2.12,1.81),(-2.3,1.63)]
    b.extrude('paint',outline,-.52,.52)
    sideglass=[(-.52,1.08),(.78,.85),(1.01,.16),(2.02,.15),
               (2.18,.4),(2.04,1.65),(1.92,1.7),(-.52,1.7)]
    for sign in [-1,1]:
        y=sign*.526
        b.extrude('dark',[(x,z) for x,z in sideglass],y,y+sign*.012)
        inner=[(-.46,1.13),(.84,.9),(1.08,.21),(1.97,.21),(2.12,.42),
               (1.98,1.63),(1.87,1.65),(-.46,1.65)]
        b.extrude('glass',inner,y+sign*.014,y+sign*.02)
        # Swept yellow door skin and recessed lower moulding.
        b.extrude('edge',[(-2.05,.17),(.79,.17),(.59,.68),(.38,.8),(-.6,1.0),(-2.05,1.03)],
                  y+sign*.012,y+sign*.022)
        b.extrude('paint',[(-2,.22),(.71,.22),(.55,.65),(.34,.74),(-.63,.94),(-2,.97)],
                  y+sign*.026,y+sign*.038)
        # Distinct sliding rear panel, with its own inset upper cover.
        rear=[(-2.19,.13),(-.67,.13),(-.58,1.73),(-2.17,1.73)]
        b.extrude('edge',rear,y+sign*.04,y+sign*.052)
        b.extrude('paint',[(-2.12,.18),(-.74,.18),(-.65,1.68),(-2.12,1.68)],
                  y+sign*.055,y+sign*.064)
        b.extrude('edge',[(-2.05,1.07),(-.77,1.02),(-.72,1.61),(-2.05,1.61)],
                  y+sign*.068,y+sign*.075)
        b.extrude('paint',[(-1.99,1.12),(-.83,1.08),(-.79,1.55),(-1.99,1.55)],
                  y+sign*.078,y+sign*.09)
        b.box('dark',(-1.82,y+sign*.105,1.04),(.16,.026,.045),.007)
        b.rod('steel',(-2.1,y+sign*.06,.07),(-.65,y+sign*.06,.07),.027,8)
        b.rod('dark',(.78,y+sign*.033,.88),(.78,y+sign*.033,1.67),.025,6)
        # Large stacked mirrors, mounted on an extended arm.
        b.rod('paint',(1.82,y,1.68),(2.46,sign*.83,1.62),.024,8)
        b.rod('dark',(2.46,sign*.83,.93),(2.46,sign*.83,1.63),.025,8)
        for z,h in [(1.39,.38),(1.02,.22)]:
            b.box('dark',(2.46,sign*.84,z),(.12,.24,h),.04)
            b.box('steel',(2.394,sign*.84,z),(.008,.195,h-.055),.015)
    # Windscreen follows the raked nose; glazing continues below the wiper.
    front=[(2.324,-.45,.48),(2.324,.45,.48),(2.182,.45,1.65),(2.182,-.45,1.65)]
    b.mesh('dark',front,[(0,1,2,3)])
    b.mesh('glass',[(2.327,-.4,.54),(2.327,.4,.54),(2.194,.4,1.6),(2.194,-.4,1.6)],[(0,1,2,3)])
    b.rod('dark',(2.348,-.28,.56),(2.245,.12,1.36),.019,6)
    b.box('dark',(2.294,0,.23),(.025,.87,.3),.025)
    b.box('paint',(-.08,0,1.827),(4.14,1.08,.05),.025)
    # The roof's forward viewing area becomes the crane-mode windshield.
    b.box('dark',(.76,0,1.864),(2.32,.96,.025),.025)
    b.mesh('roofglass',[(-.34,-.43,1.879),(1.87,-.43,1.879),
                        (1.87,.43,1.879),(-.34,.43,1.879)],[(0,1,2,3)])
    b.rod('dark',(.5,-.44,1.89),(.5,.44,1.89),.019,6)
    b.rod('dark',(1.76,-.35,1.9),(1.13,.23,1.9),.015,6)
    def placed(vertex):
        x,y,z=vertex
        if mode=='crane':
            x,z=z-.9,-x  # Roof +Z -> jib-facing +X; road nose +X -> down.
        return (x+origin[0],y+origin[1],z+origin[2])
    for key,(vertices,faces,smooth) in b.parts.items():
        offset=len(target.parts[key][0])
        target.parts[key][0].extend(placed(v) for v in vertices)
        target.parts[key][1].extend(tuple(i+offset for i in f) for f in faces)
        target.parts[key][2].extend(smooth)

def truss(b,start,length,height=.85,width=.9,taper=0):
    x,y,z=start
    count=math.ceil(length/1.18)
    def section(t):
        s=1-taper*t/length
        return [(x+t,y-width*s/2,z),(x+t,y+width*s/2,z),(x+t,y,z+height*s)]
    # Alternating Warren diagonals, instead of two intersecting rods per bay.
    for i in range(count):
        a=section(length*i/count);c=section(length*(i+1)/count)
        for j in range(3):
            b.rod('paint',a[j],c[j],.055 if j<2 else .065,8)
        for j in [0,1]:
            b.rod('paint',a[j] if i%2==0 else a[2],c[2] if i%2==0 else c[j],.032,6)
        b.rod('paint',a[i%2],c[1-i%2],.026,6)
    for t in [0,length]:
        p=section(t)
        for j in range(3): b.rod('paint',p[j],p[(j+1)%3],.045,8)

def winch(b,x,y,z,r=.26):
    # Exposed drum with closely spaced cable turns and separate end cheeks.
    b.rod('dark',(x,y-.29,z),(x,y+.29,z),r,20)
    for sy in [-.33,.33]:
        b.rod('paint',(x,y+sy-.025,z),(x,y+sy+.025,z),r*1.23,20)
        b.rod('steel',(x,y+sy-.04,z),(x,y+sy+.04,z),r*.43,12)
    for sy in [-.24+i*.048 for i in range(11)]:
        b.rod('steel',(x,y+sy-.01,z),(x,y+sy+.01,z),r*1.01,20)
    for sy in [-.37,.37]:
        b.extrude('paint',[(x-.36,z-.36),(x+.36,z-.36),(x+.21,z+.11),(x-.17,z+.11)],
                  y+sy-.025,y+sy+.025)

def mast_section(b,px,z0,z1,w,d):
    # Two longitudinal side channels with an open, cross-braced front/back face.
    for sign in [-1,1]:
        b.box('paint',(px,sign*d/2,(z0+z1)/2),(w,.09,z1-z0))
        for sx in [-1,1]:
            b.box('paint',(px+sx*w/2,sign*(d/2-.05),(z0+z1)/2),(.09,.19,z1-z0))
    count=math.ceil((z1-z0)/1.08)
    for i in range(count):
        za=z0+(z1-z0)*i/count;zb=z0+(z1-z0)*(i+1)/count
        for sx in [-1,1]:
            x=px+sx*w/2
            b.rod('paint',(x,-d/2,za),(x,d/2,zb),.027,6)
            b.rod('paint',(x,d/2,za),(x,-d/2,zb),.027,6)
    for z in [z0,z1]:
        b.box('edge',(px,0,z),(w+.11,d+.12,.15),.012)
        b.box('paint',(px,0,z+.11),(w+.09,d+.1,.065))
    b.rod('steel',(px+.11,-d/2-.07,z0),(px+.11,-d/2-.07,z1),.025,8)

def working():
    b=Builder();carrier(b,False)
    px=MAST_X
    b.box('paint',(px,0,1.97),(1.26,1.06,.4),.05)
    for z0,z1,w,d in [(2.15,12.5,.98,.88),(12.4,22.3,.77,.7),(22.2,31.6,.58,.56)]:
        mast_section(b,px,z0,z1,w,d)
    winch(b,px-1.22,0,2.06,.24)
    # Continuous lift rail and a dark cable carrier on the mast's side.
    for y in [-.61,.61]:
        b.rod('steel',(px-.28,y,2.4),(px-.28,y,30.3),.032,8)
        for z in [3+i*2 for i in range(14)]:
            b.rod('paint',(px-.28,y,z),(px+.16,y,z),.026,6)
    b.box('dark',(px-.54,.51,16.1),(.095,.075,26.2))
    # The complete cabin pitches a quarter turn, then rises along the mast.
    # Its roof glazing now looks forward along the jib, and its nose points down.
    cabin(b,(px+.25,-1.13,28.0),mode='crane')
    # Mast carriage and hinge supports remain fixed to the lift rail.
    for z in [27.5,29.3]:
        b.box('dark',(px,-.56,z),(.72,.16,.34),.025)
        b.rod('steel',(px,-.59,z),(px,-.87,z),.075,10)
    for y in [-.39,.39]:
        b.rod('paint',(px-1.24,y,1.7),(px,y,3.65),.115,12)
        b.rod('steel',(px-1.8,y,1.7),(px-.4,y,3.08),.07,10)
    b.box('dark',(px,0,31.71),(.83,.88,.28),.035)
    # Long folding jib with several elevated suspension masts, not a top slewer's counter-jib.
    for offset,length,height,width,taper in [(0,12.7,.86,.92,0),(12.7,10.5,.86,.92,0),(23.2,12.8,.83,.88,.12),(36,4,.67,.71,.08)]:
        truss(b,(px+offset,0,32),length,height,width,taper)
    # Plate pairs and hinge pins connect the three independently folding spans.
    for x in [px,px+12.7,px+23.2]:
        for y in [-.47,.47]:
            b.extrude('paint',[(x-.25,31.92),(x+.25,31.92),(x+.17,32.21),(x-.15,32.26)],y-.035,y+.035)
            b.rod('steel',(x,y-.09,32.08),(x,y+.09,32.08),.1,12)
        b.rod('dark',(x-.35,-.31,32.5),(x+.52,-.31,32.5),.07,10)
        b.rod('steel',(x+.5,-.31,32.5),(x+.92,-.31,32.5),.04,8)
    for x,h in [(px,3.28),(px+12.7,3.28),(px+23.2,3.28)]:
        b.rod('paint',(x,0,32.55),(x,0,32.55+h),.061,8)
        b.rod('steel',(x-.16,-.13,32.7),(x+.16,.13,32.7),.07,10)
    for a,c in [((px,0,35.83),(px+12.7,0,35.83)),
                ((px+12.7,0,35.83),(px+23.2,0,35.83)),
                ((px+23.2,0,35.83),(px+39.3,0,32.46)),
                ((px,0,35.83),(px+12.7,0,32.8)),
                ((px+12.7,0,35.83),(px+23.2,0,32.6))]:
        b.rod('steel',a,c,.022,6)
    # Rear-folding suspension stays return to ballast mounted on the carrier.
    b.rod('paint',(px,0,35.83),(px-3.8,0,33.7),.05,8)
    b.rod('paint',(px-3.8,0,33.7),(px,0,32.3),.05,8)
    for y in [-.26,.26]:
        b.rod('steel',(px-3.8,y,33.7),(px-3.8,y,3.0),.022,6)
    # Stay anchors meet the top of the machinery housing, rather than hanging
    # above the ballast. Shoulder plates and sheaves carry the folding head.
    for y in [-.26,.26]:
        b.box('paint',(px-3.8,y,3.08),(.22,.09,.24),.018)
        b.rod('steel',(px-3.8,y-.08,3.14),(px-3.8,y+.08,3.14),.059,10)
    for y in [-.42,.42]:
        b.extrude('paint',[(px-.37,31.4),(px+.42,31.4),(px+.64,31.98),
                          (px+.35,32.45),(px-.23,32.49),(px-.55,32.08)],y-.04,y+.04)
        for x,z in [(px,31.83),(px+.36,32.19)]:
            b.rod('dark',(x,y-.05,z),(x,y+.05,z),.135,16)
            b.rod('steel',(x,y-.065,z),(x,y+.065,z),.079,12)
    for y in [-.27,.27]:
        b.rod('steel',(px+36,y,31.98),(px+36,y,32.09),.105,12)
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
    cabin(b,(3.94,-.65,1.57),mode='driving')
    # Nested mast beside the cab; rear mechanisms remain visibly open.
    b.box('paint',(-.18,.55,2.89),(10.55,.67,.57),.035)
    for x in [-4.5,-2,.5,3]:
        b.box('edge',(x,.55,2.89),(.12,.75,.68),.01)
    for y in [.19,.91]:
        b.rod('paint',(5.62,y,1.82),(4.1,y,3.37),.12,10)
        b.rod('steel',(5.66,y,2.06),(4.51,y,3.27),.065,10)
        b.rod('steel',(5.47,y-.09,2.04),(5.47,y+.09,2.04),.18,14)
    # Full-depth parallel folded sections; no taper across the entire roof.
    truss(b,(-6.6,-.37,3.41),12.7,.64,1.1)
    truss(b,(-6.36,.47,3.43),12.1,.55,.95)
    truss(b,(-5.9,.05,3.26),10.8,.53,.74)
    for x in [-6.46,5.79]:
        b.rod('paint',(x,-.96,3.51),(x,.99,3.51),.105,10)
        b.rod('steel',(x,-1.01,3.51),(x,1.04,3.51),.063,10)
    # Rear folding linkage, cable drum and exposed diagonal supports.
    winch(b,-5.49,-.12,2.69,.30)
    for y in [-.61,.61]:
        b.rod('paint',(-6.4,y,3.45),(-5.54,y,2.21),.075,8)
        b.rod('paint',(-5.54,y,2.21),(-2.07,y,2.69),.065,8)
        b.rod('steel',(-5.78,y,3.4),(-5.03,y,2.73),.055,8)
        b.rod('dark',(-5.03,y,2.73),(-3.86,y,2.47),.082,10)
        b.rod('paint',(-5.59,y,2.22),(-5.59,y,3.4),.051,8)
    # Prominent front knuckle and sheave cluster beside the driving windshield.
    for x,z in [(5.97,2.12),(5.42,2.39),(4.75,3.55)]:
        for y in [.2,.92]:
            b.rod('dark',(x,y-.075,z),(x,y+.075,z),.19,16)
            b.rod('steel',(x,y-.084,z),(x,y+.084,z),.145,16)
            b.rod('paint',(x,y-.093,z),(x,y+.093,z),.065,12)
    for y in [.24,.86]:
        for a,c in [((6.08,y,2.08),(5.19,y,3.32)),((5.19,y,3.32),(4.45,y,3.93)),
                    ((6.08,y,2.08),(5.65,y,1.69)),((5.65,y,1.69),(5.05,y,1.78))]:
            b.rod('paint',a,c,.07,8)
        b.rod('dark',(5.98,y,2.28),(4.89,y,3.68),.035,6)
    for i in range(4):
        b.rod('dark',(5.47,.3+i*.1,2.17),(4.77,.3+i*.1,3.28),.023,6)
    # Grey front linkage bridge with paired pivots and hydraulic fittings.
    b.extrude('dark',[(5.41,2.11),(6.01,2.11),(6.15,2.38),(5.89,2.65),(5.55,2.53)],
              .08,1.08)
    for y in [.12,1.045]:
        for x,z in [(5.66,2.33),(5.94,2.42)]:
            b.rod('steel',(x,y-.055,z),(x,y+.055,z),.095,12)
            b.rod('paint',(x,y-.065,z),(x,y+.065,z),.042,10)
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
bpy.ops.object.camera_add(location=(18,-30,8.8))
camera=bpy.context.object;camera.name='Studio_camera';to_studio(camera)
camera.rotation_euler=(Vector((0,0,2.0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=17.6;bpy.context.scene.camera=camera
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
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
