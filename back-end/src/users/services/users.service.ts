import { All, Injectable } from '@nestjs/common';
import { PrismaClient, User, Game, notificationType } from '@prisma/client';
import { GamesDTO, AllGames, topPlayers, RecentActivity, ProfileFriends, blockedlist } from '../dto/dto-classes';
import { create } from 'domain';
import { type } from 'os';
import { NotificationGateway } from 'src/events/notification/notification.gateway';

@Injectable()
export class UsersService {
	prisma = new PrismaClient();
	constructor(){}
    

    async	createUser(user : User){
		const newUser = await this.prisma.user.create({
			data: user,
		});
		return newUser;
	}

    async findOneUser(user : User){
		const findUser = await this.prisma.user.findUnique({
			where: {
				UserId: user.UserId,
			},
		});
		if (!findUser){
			return false;
		}
		return true;
    }

	async cancelRequest(FriendshipId : number)
	{
		const friendship = await this.prisma.friendship.delete({
			where: {
			  FriendshipId: FriendshipId
			},
		});
		return true;
	}

	async ReturnOneUser(user : User){
		const findUser = await this.prisma.user.findUnique({
			where: {
				email: user.email,
			},
		});
		if (!findUser){
			return findUser;
		}
		return findUser;
    }


	async getBlockedlist(User : User)
	{
		var blockedlist : blockedlist [] = [];
		const blockedBySender = await this.prisma.friendship.findMany({
			where : {
					SenderId: User.UserId,
					blockedBySender : true,
				},
			select : {
				receiver :
				{
					select : {
						UserId : true,
						username : true,
						avatar : true,
					}
				}
			}
		});

		blockedBySender.map((friend) => {
			const { avatar, UserId, username} = friend.receiver;
			blockedlist.push({
				avatar : avatar,
				username : username,
				UserId : UserId,
			})
		});

		const blockedByreceiver = await this.prisma.friendship.findMany({
			where : {
					ReceiverId: User.UserId,
					blockedByReceiver : true,
				},
			select : {
				sender:
				{
					select : {
						UserId : true,
						username : true,
						avatar : true,
					}
				}
			}
		});

		blockedByreceiver.map((friend) => {
			const { avatar, UserId, username} = friend.sender;
			blockedlist.push({
				avatar : avatar,
				username : username,
				UserId : UserId,
			})
		});

		return blockedlist; 
	}


	async sendRequest(User : User, receiverId : string)
	{
		const existingRequest = await this.prisma.friendship.findFirst({
			where: {
			  SenderId: User.UserId,
			  ReceiverId: receiverId
			}
		});

		if (existingRequest)
			return true;

		await this.prisma.friendship.create ({
			data: {
			  sender: {
				connect: { UserId: User.UserId }
			  },
			  receiver: {
				connect: { UserId: receiverId }
			  },
			}
		});

		const notification =  await this.prisma.notification.create({
			data: {
				UserId: receiverId,
				Type: notificationType.friendship_request, 
				isRead: false,
			  },
		})
		// NotificationGateway
	}

	async AcceptRequest(FriendshipId : number)
	{
		const friend = await this.prisma.friendship.update({
			where: { FriendshipId : FriendshipId,  },
			data: { Accepted : true},
		});

		const notification =  await this.prisma.notification.create({
			data: {
				UserId: friend.SenderId,
				Type: notificationType.Accepted_request, 
				isRead: false,
			  },
		})
	}

	

	async updateUser(email, updatedObject)
	{
		try {
		const updatedUser = await this.prisma.user.update({
			where: { email: email },
			data: updatedObject
		  });
		  return updatedUser;
		}
		 catch (error) {
		  console.error("Error updating user:", error);
		  return null;
		}
	}

}
