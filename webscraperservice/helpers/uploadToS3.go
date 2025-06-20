package helpers

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	log "github.com/sirupsen/logrus"
)

func UploadPreviousFolder(previous_timestamp int64) string {
	source_folder := fmt.Sprintf("savedPages/%v", previous_timestamp)
	target_folder := fmt.Sprintf("uploadPages/%v.zip", previous_timestamp)
	err := zipFolder(source_folder, target_folder)
	Assert(err == nil, fmt.Sprintf("Issue creating the zip file, %v", err))
	secure_url := UploadZipToCloudinary(target_folder, previous_timestamp)
	deleteFolder(source_folder)
	deleteZipFile(target_folder)
	return secure_url
}

func zipFolder(source, target string) error {
	zipfile, err := os.Create(target)
	if err != nil {
		return err
	}
	defer zipfile.Close()
	archive := zip.NewWriter(zipfile)
	defer archive.Close()
	err = filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(filepath.Dir(source), path)
		if err != nil {
			return err
		}
		header.Name = relPath
		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}
		writer, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()
			_, err = io.Copy(writer, file)
			if err != nil {
				return err
			}
		}
		return nil
	})
	return err
}

func deleteFolder(folder_path string) {
	err := os.RemoveAll(folder_path)
	Assert(err == nil, fmt.Sprintf("Issue deleting the folder %v", err))
}

func deleteZipFile(file_path string) {
	err := os.Remove(file_path)
	Assert(err == nil, fmt.Sprintf("Issue deleting the file %v", err))
}

func UploadZipToCloudinary(zip_file_path string, timestamp int64) string {
	cld, err := cloudinary.NewFromParams(os.Getenv("CLOUDINARY_CLOUD_NAME"), os.Getenv("CLOUDINARY_API_KEY"), os.Getenv("CLOUDINARY_API_SECRET"))
	Assert(err == nil, fmt.Sprintf("Failed to initialize cloudinary %v", err))
	file, err := os.Open(zip_file_path)
	Assert(err == nil, fmt.Sprintf("Error opening file %v", err))
	defer file.Close()
	uploadParams := uploader.UploadParams{
		ResourceType: "raw",
		PublicID:     fmt.Sprintf("scrapedPages/%v", timestamp),
		Type:         "upload",
	}
	ctx := context.Background()
	upload_result, err := cld.Upload.Upload(ctx, file, uploadParams)
	Assert(err == nil, fmt.Sprintf("Upload failed %v", err))
	log.Info("Upload successful!")
	return upload_result.SecureURL
}
