"""Rode vaarwaterboei (stompe ton, bakboordzijde), ~2,4 m hoog. Voorbeeldmodel.
blender/make.sh boei_rood --png art/buoy_blender.png --view iso --px 24"""
import bglib as B

B.reset()
rood = B.mat('rood', '#d0342c', rough=0.45)
donker = B.mat('donkerrood', '#8e1f1a', rough=0.6)
wit = B.mat('wit', '#f2f2ee', rough=0.4)
staal = B.mat('staal', '#5d666b', rough=0.5, metal=0.4)
lamp = B.mat('lamp', '#ffd25a', emit=3.0)

B.cyl('drijver', 0.9, 0.7, (0, 0, 0.15), donker, bevel=0.08)        # onderwaterdeel / zwemband
B.torus('stootrand', 0.92, 0.07, (0, 0, 0.42), staal)
B.cyl('ton', 0.62, 1.3, (0, 0, 1.1), rood, bevel=0.05, r2=0.55)      # stompe ton, iets taps
B.cyl('band', 0.6, 0.18, (0, 0, 1.25), wit)                          # retroreflecterende band
B.cyl('deksel', 0.58, 0.08, (0, 0, 1.79), donker, bevel=0.02)
for i, (x, y) in enumerate([(0.3, 0), (-0.15, 0.26), (-0.15, -0.26)]):
    B.cyl(f'poot{i}', 0.03, 0.45, (x * 0.8, y * 0.8, 2.0), staal)
B.cyl('lampvoet', 0.12, 0.12, (0, 0, 2.2), staal)
B.sphere('lamp', 0.1, (0, 0, 2.34), lamp, scale=(1, 1, 1.3))
B.finish(__file__)
