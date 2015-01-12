# Eoin Houlihan 13323304
# Conor Brennan 13327472
# Emmet Broaders 13321123

import os
lines_per_file = 1000000
lines = []
lines_counter = 0
created_files = 0

with open('names.txt') as big_file:
    if not os.path.exists('files'):
        os.mkdir('files', 0755)
        for line in big_file:
            lines.append(line)
            lines_counter += 1
            if lines_counter == lines_per_file:
                idx = created_files
                with open('files/%s.txt' % idx, 'w') as small_file:
                    small_file.write(''.join(lines))
                lines = []
                lines_counter = 0
                created_files += 1 
        
        if lines_counter:  
            idx = created_files
            with open('files/%s.txt' % idx, 'w') as small_file:
                small_file.write(''.join(lines))
            created_files += 1
        
        file = open('files/numfile.txt', 'w')
        file.write(str(created_files))
        file.write('\n')
        file.flush()
        file.close()
