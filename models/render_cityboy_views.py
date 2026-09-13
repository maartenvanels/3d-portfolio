"""Repeatable visual inspection views. Open cityboy.blend before this script.

blender -b models/cityboy.blend --python models/render_cityboy_views.py -- --views side cabin working --prefix qa/review
These images are QA output, not site assets. No change is saved to the blend.
"""
import argparse
import os
import sys
import bpy
from mathutils import Vector

parser=argparse.ArgumentParser()
parser.add_argument('--views',nargs='+',default=['side','cabin','working'])
parser.add_argument('--prefix',default='qa/cityboy-review')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
scene=bpy.context.scene
work=bpy.data.objects['CityBoy_Working']
road=bpy.data.objects['CityBoy_Transport']
lights=[(obj,obj.location.copy(),obj.data.energy,obj.data.size) for obj in bpy.data.objects if obj.type=='LIGHT']
views={
    'side': (False,(0,40,2.3),(0,0,2.1),15,1400,520),
    'front': (False,(19,27,9),(0,0,2),17,1400,820),
    'rear': (False,(-15,22,7),(-1,0,2),13,1300,760),
    'cabin': (True,(10,12,29.5),(3.8,.65,28),6.8,900,900),
    'base': (True,(12,18,6),(.2,0,2),13,1300,760),
    'rear-base': (True,(-12,-18,6),(-.8,0,2),11,1300,760),
    'working': (True,(43,68,34),(18,0,17.8),54,1300,1100),
}
for view in args.views:
    deployed,position,target,scale,width,height=views[view]
    for root,hidden in [(work,not deployed),(road,deployed)]:
        for obj in [root,*root.children_recursive]:
            obj.hide_render=hidden
            obj.hide_set(hidden)
    bpy.data.objects['Studio_floor'].hide_render=view=='cabin'
    for obj,location,power,size in lights:
        obj.location=location
        obj.data.energy=power
        obj.data.size=size
        if view=='cabin':
            obj.location.z+=26
        elif view=='working':
            obj.location=Vector((location.x*3,location.y*3,location.z*3))
            obj.data.energy=power*9
            obj.data.size=size*3
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    camera=scene.camera
    camera.location=position
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=scale
    scene.cycles.samples=24
    scene.render.resolution_x=width
    scene.render.resolution_y=height
    scene.render.filepath=os.path.abspath(args.prefix+'-'+view+'.jpg')
    os.makedirs(os.path.dirname(scene.render.filepath),exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print('REVIEW_READY',scene.render.filepath,flush=True)
