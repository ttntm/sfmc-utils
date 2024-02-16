#!/bin/bash

# THIS SCRIPT IS BASED ON:  https://github.com/eloone/mergejs
# LAST UPDATE:              Sept. 29th 2023
# AUTHOR:                   ttntm

merge_files () {
  if [ ! -f $1 ]; then
    echo '[ERROR]' $1 'is not a regular file. It must be a text file.';
  else
    files=`cat $1`;
    marker=0
    merge_file=$2;

    # remove existing output file if there is one
    if [ -f $merge_file ]; then
      rm $merge_file;
    fi

    # opening statement
    echo -e 'function sfmcUtils() {'\ >> $merge_file;

    if [ './src/_private.js' != '#' ]; then
      cat ./src/_private.js >> $merge_file;
      echo -e '\n' >> $merge_file;
    fi

    for file in $files; do
      if [ ${file:0:1} != '#' ]; then
        if [ "$file" != "$merge_file" ]; then
          if [ "$marker" -gt 0 ]; then
            echo -e '\n' >> $merge_file;
          fi

          marker=$(( marker + 1 ))
          cat $file >> $merge_file;
        fi
      fi
    done

    # closing statement
    echo -e '\n\nreturn {'\ >> $merge_file;
    
    marker=0
    
    for file in $files; do
      if [ "$file" != "$merge_file" ]; then
        rs=$(echo "$file" | sed -r "s/.+\/(.+)\..+/\1/")
        
        if [ "$marker" -le 0 ]; then
          echo "$rs: $rs" >> $merge_file;
        else
          echo -e ', '"$rs: $rs" >> $merge_file;
        fi
        
        marker=$(( marker + 1 ))
      fi
    done

    echo -e '}\n}' >> $merge_file;

    echo '[MERGE SUCCESS] The files listed in "'$1'" have been successfully merged into "'$2'"';
  fi
}

# START
if [ $# -lt 2 ]; then
  echo '';
  echo '[HELP]';
  echo 'Builds the SFMC Utilities wrapper.';
  echo '  - The correct syntax for this command is '$0 'input_list_file merge_file';
  echo '  - If there are private variables/methods, `./src/_private.js` should be used';
  echo '  - The order of the functions can be defined in `include.txt`';
  echo '';
else
  merge_files $1 $2;	
fi
