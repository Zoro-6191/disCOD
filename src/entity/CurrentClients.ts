import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("current_clients")
export class CurrentClients extends BaseEntity
{
    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id" 
    })
    id: number;

    @Column("varchar", { 
        name: "Updated", 
        length: 25 
    })
    updated: string;

    @Column("varchar", { name: "Name", length: 32 })
    name: string;

    @Column("int", { name: "Level" })
    level: number;

    @Column("int", { name: "DBID" })
    dbid: number;

    @Column("varchar", { name: "CID", length: 32 })
    cid: string;

    @Column("varchar", { name: "Joined", length: 25 })
    joined: string;

    @Column("int", { name: "Connections" })
    connections: number;

    @Column("int", { name: "State" })
    state: number;

    @Column("int", { name: "Score" })
    score: number;

    @Column("varchar", { name: "IP", length: 16 })
    ip: string;

    @Column("varchar", { name: "GUID", length: 36 })
    guid: string;

    @Column("varchar", { name: "PBID", length: 32 })
    pbid: string;

    @Column("int", { name: "Team" })
    team: number;

    @Column("varchar", { name: "ColorName", length: 32 })
    colorName: string;
}
