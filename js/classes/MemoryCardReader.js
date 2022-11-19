class MemoryCardReader{
	constructor(){
		this.blobBuilder = new BlobBuilder();
		this.viewer = null;
		this.headerBlob = null;
		this.saveSlotArray = [];
		this.saveSlotBlobs = [];
		this.saveSlotArrayBuffers = [];
	}
	async loadMemoryCardData(blob){
		this.headerBlob = blob.slice(0,0x2000);
		this.viewer = new DataView(await blob.arrayBuffer());
		this.saveSlotArray = [];
		this.saveSlotBlobs = [];
		this.saveSlotArrayBuffers = [];
		let tempBlob;
		let i = 1;
		while(i < 17){
			tempBlob = blob.slice(0x2000 * i++, 0x2000 * i);
			this.saveSlotBlobs.push(tempBlob);
			this.saveSlotArrayBuffers.push(await tempBlob.arrayBuffer());
		}
		this.findDigimonSaves();
	}
	getDigimonSavesBlob(){
		this.blobBuilder.wipe();
		this.blobBuilder.append(this.headerBlob);
		for(let i = 0; i < this.saveSlotArray.length; i++){
			if(this.saveSlotArray[i] == "empty" || this.saveSlotArray[i] == "unknown"){
				this.blobBuilder.append(this.saveSlotBlobs[i]);
			}else{
				this.blobBuilder.append(new Uint8Array(this.saveSlotArray[i].getSaveArray()));
			}
		}
		return this.blobBuilder.getBlob();
	}
	getSaveSlotData(index){
		return this.saveSlotArray[index];
	}
	findDigimonSaves(){
		let tempOffset;
		let offset = 0x80;
		let productCode;
		let index;
		while(offset < 0x800){
			index = offset/0x80-1;
			productCode = this.viewer.getBigUint64(offset + 0xF, true);
			if(productCode == 4914046425491320147n){
				tempOffset = offset/0x80*0x2000;
				this.saveSlotArray[index] = new DigimonSave(this.saveSlotArrayBuffers[index]);
			}else if(productCode == 0n){
				this.saveSlotArray[index] = "empty";
			}else{
				this.saveSlotArray[index] = "unknown";
			}
			offset += 0x80;
		}
	}
}