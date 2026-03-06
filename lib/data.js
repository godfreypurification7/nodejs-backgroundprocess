const fs=require('fs');
const path=require('path');

const lib={};

// base directory of the datafolder 
lib.basedir = path.join(__dirname, '/../.data/');


//write data to file

lib.create=(dir, file,data,callback)=>{
    //open file to write
    fs.open(`${lib.basedir + dir}/${file}.json`, 'wx',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //convet data to string 
            const stringData=JSON.stringify(data);
            //write data and close
            fs.writeFile(fileDescriptor, stringData,(err2)=>{
                if(!err2){
                    fs.close(fileDescriptor,(err3)=>{
                        if(!err3){
                            callback(false);
                        }else{
                            callback('Error closing the new file!')
                        }
                    })

                }else{
                    callback('Error writing to new file!');
                }
            })
        }
        else 
        {
            callback('There was an error, file may already exists!');
            // 'Could not create new file, it may already exist!');
        }

    })
};
//read data from file 
lib.read=(dir, file,callback)=>{
    fs.readFile(`${lib.basedir + dir}/${file}.json`, 'utf8', (err, data)=>{
        callback(err,data);
    });
};
//update existing file
lib.update=(dir, file,data,callback)=>{
    //open to write the file
    fs.open(`${lib.basedir + dir}/${file}.json`, 'r+',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //convert data to string
            const stringData=JSON.stringify(data);
            //truncate the file
            fs.ftruncate(fileDescriptor, (err1)=>{
                if(!err1){
                    //wrtie the file and close
                    fs.writeFile(fileDescriptor, stringData, (err2)=>{
                        if(!err2){
                            fs.close(fileDescriptor,(err3)=>{
                                if(!err3){
                                   callback(false)
                                }else{
                                         callback('Error closing file!')
                                }
                            });

                        }else{
                            callback('Error writing the file')
                        }
                    })
                }else{
                    callback('Error truncating file!');
                }
                
            })

        }else{
            console.log('Error updating.FIle may not exists!')
        }

    })
};
//delete the file
lib.delete=(dir,file,callback)=>{
    //unlink file
    fs.unlink(`${lib.basedir + dir}/${file}.json`,(err)=>{
        if(!err){
            callback(false)
        }else{
            callback('Error deleting file');
        }
    });
};
//list all the items in a directory
lib.list=(dir,callback)=>{
    fs.readdir(`${lib.basedir + dir}/`,(err,fileNames)=> {
        if(!err && fileNames && fileNames.length>0){
            let trimmedFileNames=[];
            fileNames.forEach(fileName=>{
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(false,trimmedFileNames);

        }else{
            callback('error reading directory');
        }
    });

};
module.exports=lib;

