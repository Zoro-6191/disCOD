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
}

declare var GlobalGroups: GlobalGroup[];

export async function initGroups(): Promise<void>
{
    return new Promise( async(resolve, reject) => {
        if( GlobalGroups.length )
            reject("Group Module has already been initiated");

        // now we get groups from table and add to "globalGroups"
        const dbsearch = await Groups.find();

        if( !dbsearch.length )
            reject("Database Table 'groups' was fetched empty");

        dbsearch.forEach( group => {
            GlobalGroups.push({ bits: group.id, ...group })
        })

        // TO-DO: highest and lowest levels

        events.emit("groups_ready");
        resolve();
    })
}

interface GroupOps 
{
    bitsToLevel( bits: number ): number | null;
    bitsToKeyword( bits: number ): string | null;
    bitsToName( bits: number ): string | null;
    keywordToBits( keyword: string ): number | null;
    keywordToLevel( keyword: string ): number | null;
    keywordToName( keyword: string ): string | null;
    levelToBits( level: number ): number | null;
    levelToKeyword( level: number ): string | null;
    levelToName( level: number ): string | null;
}

interface GroupMan {
    getAllGroups(): GlobalGroup[];
    getGroupFromLevel( level: number ): GlobalGroup | undefined;
    getGroupFromBits( bits: number ): GlobalGroup | undefined;
    getGroupFromKeyword( keyword: string ): GlobalGroup | undefined;
    isValidLevel( level: number ): boolean;
    isValidKeyword( keyword: string ): boolean;
    isValidBits( bits: number ): boolean;
    Ops: GroupOps
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
}

function bitsToKeyword(bits: number): string | null {
    return compare< typeof bits, string >( "bits", bits, "keyword" );
}
function bitsToName(bits: number): string | null {
    return compare< typeof bits, string >( "bits", bits, "name" );
}
function bitsToLevel(bits: number): number | null {
    return compare< typeof bits, number >( "bits", bits, "level" );
}
function keywordToBits(keyword: string): number | null {
    return compare< typeof keyword, number >( "keyword", keyword, "bits" );
}
function keywordToLevel(keyword: string): number | null {
    return compare< typeof keyword, number >( "keyword", keyword, "level" );
}
function keywordToName(keyword: string): string | null {
    return compare< typeof keyword, string >( "keyword", keyword, "name" );    
}
function levelToBits(level: number): number | null {
    return compare< typeof level, number >( "level", level, "bits" );    
}
function levelToKeyword(level: number): string | null {
    return compare< typeof level, string >( "level", level, "keyword" );
}
function levelToName(level: number): string | null {
    return compare< typeof level, string >( "level", level, "name" );
}

function compare<T1, T2>( p1: string, p2: T1, toreturn: string ): T2 | null
{
    for( var i = 0; i < GlobalGroups.length; i++ )
    {
        const group: GlobalGroup = GlobalGroups[i];
        // TO-DO: make it more type safe ig
        if( (group as any)[p1] == p2 )
            return (group as any)[toreturn];
    }
    return null;
}

var GroupManager: GroupMan = {
    getGroupFromLevel,
    getAllGroups,
    getGroupFromBits,
    getGroupFromKeyword,
    isValidBits,
    isValidKeyword,
    isValidLevel,
    Ops,
}

export default GroupManager;