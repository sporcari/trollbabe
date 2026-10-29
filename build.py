#!/usr/bin/env python3
"""Assembla le due versioni a partire da src/.
   dist/trollbabe-artifact.html  -> per l'artifact dentro Claude (usa window.claude)
   index.html                    -> per GitHub Pages (aggiunge shim.js e PeerJS)"""
import subprocess, sys, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rd=lambda f: open('src/'+f,encoding='utf-8').read()
head=rd('head.html'); assert head.rstrip().endswith('<script>')
head=head.rstrip()[:-len('<script>')]
core=rd('c1_core.js')+rd('c1m_map.js')+rd('c2_ui.js')+rd('c3_ai.js')
tail='\n</script>\n</body>\n</html>\n'
artifact=head+'<script>\n'+core+tail
standalone=(head+'<script src="https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js"></script>\n<script>\n'
            +rd('shim.js')+'\n</script>\n<script>\n'+core+tail)
os.makedirs('dist',exist_ok=True)
open('dist/trollbabe-artifact.html','w',encoding='utf-8').write(artifact)
open('index.html','w',encoding='utf-8').write(standalone)
for name,html in (('artifact',artifact),('standalone',standalone)):
    for i,sc in enumerate(re.findall(r'<script>\n(.*?)\n</script>',html,re.S)):
        p=f'/tmp/_tb_{name}_{i}.js'; open(p,'w',encoding='utf-8').write(sc)
        r=subprocess.run(['node','--check',p],capture_output=True,text=True)
        if r.returncode: print('ERRORE DI SINTASSI',name,i,r.stderr); sys.exit(1)
print('ok: dist/trollbabe-artifact.html (%d byte), index.html (%d byte)'%(len(artifact),len(standalone)))
