import i18next from "i18next";
import ProfileRepository from "./profile.repository.js";
import {
  NotFoundError,
  AuthError,
} from "../exceptions/index.js";

const getProfileUserById = async (userId) => {

    const user = await ProfileRepository.getProfileByUserId(userId); 

    if(!user) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.user") })); 
    }

    return user;
}

const getProfileUserApplications = async (userId) => {

    if(!userId) {
        throw new AuthError(i18next.t("error.loginRequired")); 
    }

    const applications = await ProfileRepository.getProfileUserApplications(userId); 

    if(!applications) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.application") })); 
    }

    return applications;
}

const getProfileUserInterviews = async (userId) => {
    if (!userId) {
        throw new AuthError(i18next.t("error.loginRequired"));
    }

    const interviews = await ProfileRepository.getProfileUserInterviews(userId);

    if (!interviews) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));
    }

    return interviews;
};

const getProfileInterviewById = async (interviewId, userId) => {
    if (!userId) {
        throw new AuthError(i18next.t("error.loginRequired"));
    }

    const interview = await ProfileRepository.getProfileInterviewById(interviewId, userId);

    if (!interview) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.interview") }));
    }

    return interview;
};

const getProfileUserBookmarkedJobs = async (userId) => {

    if(!userId) {
        throw new AuthError(i18next.t("error.loginRequired")); 
    }

    const bookmarkedJobs = await ProfileRepository.getProfileBookmarkedJobs(userId); 

    if(!bookmarkedJobs) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.job") })); 
    }

    return bookmarkedJobs;
}
const updateProfile = async (userId, data) => {
    if (!userId) {
        throw new AuthError(i18next.t("error.loginRequired"));
    }

    const updatedUser = await ProfileRepository.updateProfile(userId, data);

    if (!updatedUser) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.user") }));
    }

    return updatedUser;
}

const uploadAvatar = async (userId, file) => {
    if (!userId) {
        throw new AuthError(i18next.t("error.loginRequired"));
    }

    if (!file) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.document") }));
    }

    // Update avatar URL in database
    const avatarUrl = `/profile/uploads/${file.filename}`;
    const updatedUser = await ProfileRepository.updateProfile(userId, { avatar: avatarUrl });

    if (!updatedUser) {
        throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.user") }));
    }

    return { avatarUrl, user: updatedUser };
}


export {
    getProfileUserById,
    getProfileUserApplications,
    getProfileUserBookmarkedJobs,
    getProfileUserInterviews,
    getProfileInterviewById,
    updateProfile,
    uploadAvatar,
}
