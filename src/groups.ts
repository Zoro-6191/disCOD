import { Groups } from "./entity/Groups";

declare global 
{
    type GlobalGroup = {
        readonly bits: number;
        readonly name: string;
        readonly keyword: string;
        readonly level: number;
        readonly time_edit: Date | number;
        readonly time_add: Date | number;
    }
    var GlobalGroups: GlobalGroup[];
}

export async function initGroups(): Promise<void>
{
    return new Promise( async(resolve, reject) => 
    {
        if( globalThis.GlobalGroups != undefined )
            reject("Group Module has already been initiated");

        globalThis.GlobalGroups = [];

        // now we get groups from table and add to "globalGroups"
        const dbsearch = await Groups.find();

        if( !dbsearch.length )
            reject("Database Table 'groups' was fetched empty");

        dbsearch.forEach( group => {
            globalThis.GlobalGroups.push({ 
                bits: group.id, 
                keyword: group.keyword,
                level: group.level,
                name: group.name,
                time_add: group.time_add,
                time_edit: group.time_edit 
            })
        })

        // TO-DO: highest and lowest levels

        events.emit("groups_ready");
        resolve();
    })
}

interface GroupOps 
{
    bitsToLevel( bits: number ): number | undefined;
    bitsToKeyword( bits: number ): string | undefined;
    bitsToName( bits: number ): string | undefined;
    keywordToBits( keyword: string ): number | undefined;
    keywordToLevel( keyword: string ): number | undefined;
    keywordToName( keyword: string ): string | undefined;
    levelToBits( level: number ): number | undefined;
    levelToKeyword( level: number ): string | undefined;
    levelToName( level: number ): string | undefined;
    getAllGroups(): GlobalGroup[];
    getGroupFromLevel( level: number ): GlobalGroup | undefined;
    getGroupFromBits( bits: number ): GlobalGroup | undefined;
    getGroupFromKeyword( keyword: string ): GlobalGroup | undefined;
    isValidLevel( level: number ): boolean;
    isValidKeyword( keyword: string ): boolean;
    isValidBits( bits: number ): boolean;
}

function isValidLevel(level: number): boolean {
    return isValidField<number>( "level", level );
}
function isValidKeyword(keyword: string): boolean {
    return isValidField<string>( "level", keyword );
}
function isValidBits(bits: number): boolean {
    return isValidField<number>( "level", bits );
}
function isValidField<T>( p1: string, p2: T ): boolean
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const group: GlobalGroup = GlobalGroups[i];
        if( (group as any)[p1] == p2 )
            return true;
    }
    return false;
}

function getAllGroups(): GlobalGroup[] {
    return GlobalGroups;
}

function getGroupFromLevel( level: number ): GlobalGroup | undefined
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const grp: GlobalGroup = GlobalGroups[i];
        if( grp.level == level )
            return grp;
    }
    return undefined;
}

function getGroupFromKeyword( keyword: string ): GlobalGroup | undefined
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const grp: GlobalGroup = GlobalGroups[i];
        if( grp.keyword == keyword )
            return grp;
    }
    return undefined;
}

function getGroupFromBits( bits: number ): GlobalGroup | undefined
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const grp: GlobalGroup = GlobalGroups[i];
        if( grp.bits == bits )
            return grp;
    }
    return undefined;
}

export var Ops: GroupOps = {
    bitsToKeyword,
    bitsToName,
    bitsToLevel,
    levelToBits,
    levelToKeyword,
    levelToName,
    keywordToBits,
    keywordToLevel,
    keywordToName,
    getGroupFromLevel,
    getAllGroups,
    getGroupFromBits,
    getGroupFromKeyword,
    isValidBits,
    isValidKeyword,
    isValidLevel,
}

function bitsToKeyword(bits: number): string | undefined {
    return compare< typeof bits, string >( "bits", bits, "keyword" );
}
function bitsToName(bits: number): string | undefined {
    return compare< typeof bits, string >( "bits", bits, "name" );
}
function bitsToLevel(bits: number): number | undefined {
    return compare< typeof bits, number >( "bits", bits, "level" );
}
function keywordToBits(keyword: string): number | undefined {
    return compare< typeof keyword, number >( "keyword", keyword, "bits" );
}
function keywordToLevel(keyword: string): number | undefined {
    return compare< typeof keyword, number >( "keyword", keyword, "level" );
}
function keywordToName(keyword: string): string | undefined {
    return compare< typeof keyword, string >( "keyword", keyword, "name" );    
}
function levelToBits(level: number): number | undefined {
    return compare< typeof level, number >( "level", level, "bits" );    
}
function levelToKeyword(level: number): string | undefined {
    return compare< typeof level, string >( "level", level, "keyword" );
}
function levelToName(level: number): string | undefined {
    return compare< typeof level, string >( "level", level, "name" );
}

function compare<T1, T2>( p1: string, p2: T1, toreturn: string ): T2 | undefined
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const group: GlobalGroup = GlobalGroups[i];
        // TO-DO: make it more type safe ig
        if( (group as any)[p1] == p2 )
            return (group as any)[toreturn];
    }
    return undefined;
}

export default Ops;