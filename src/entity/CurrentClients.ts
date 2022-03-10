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
    Updated: string;

    @Column("varchar", { name: "Name", length: 32 })
    Name: string;

    @Column("int", { name: "Level" })
    Level: number;

    @Column("int", { name: "DBID" })
    DBID: number;

    @Column("varchar", { name: "CID", length: 32 })
    CID: string;

    @Column("varchar", { name: "Joined", length: 25 })
    Joined: string;

    @Column("int", { name: "Connections" })
    Connections: number;

    @Column("int", { name: "State" })
    State: number;

    @Column("int", { name: "Score" })
    Score: number;

    @Column("varchar", { name: "IP", length: 16 })
    IP: string;

    @Column("varchar", { name: "GUID", length: 36 })
    GUID: string;

    @Column("varchar", { name: "PBID", length: 32 })
    PBID: string;

    @Column("int", { name: "Team" })
    Team: number;

    @Column("varchar", { name: "ColorName", length: 32 })
    ColorName: string;
}
